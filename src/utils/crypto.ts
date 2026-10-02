/**
 * Verschlüsselungs-Hilfsfunktionen für den sicheren Daten-Export / Import
 * 
 * Verwendet moderne Web Crypto API (AES-GCM 256-bit, PBKDF2 mit SHA-256).
 * Schützt personenbezogene Daten (Spielernamen, Historie) DSGVO-konform bei der
 * Weitergabe per WhatsApp oder E-Mail an Trainer-Vertretungen.
 */

export interface EncryptedPayload {
  version: 1;
  salt: string; // Base64
  iv: string;   // Base64
  data: string; // Base64 Ciphertext
}

/**
 * Wandelt einen ArrayBuffer in einen Base64-String um
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Wandelt einen Base64-String in einen Uint8Array um
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Leitet einen kryptografischen AES-GCM Schlüssel aus einem Passwort und Salt ab (PBKDF2)
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Verschlüsselt beliebige JavaScript-Daten mit einem Passwort.
 * Gibt einen JSON-String mit Salt, IV und verschlüsseltem Ciphertext zurück.
 */
export async function encryptData<T>(data: T, password: string): Promise<string> {
  if (!password || password.trim().length === 0) {
    throw new Error('Das Passwort darf nicht leer sein.');
  }

  // 16 Bytes Zufalls-Salt erzeugen
  const salt = crypto.getRandomValues(new Uint8Array(16));
  // 12 Bytes Initialisierungsvektor für AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));

  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as BufferSource
    },
    key,
    plaintext
  );

  const payload: EncryptedPayload = {
    version: 1,
    salt: bufferToBase64(salt.buffer as ArrayBuffer),
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
    data: bufferToBase64(ciphertext)
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Entschlüsselt einen verschlüsselten Payload-String mit dem angegebenen Passwort.
 * Wirft einen verständlichen Fehler, wenn das Passwort falsch oder die Datei beschädigt ist.
 */
export async function decryptData<T>(encryptedJsonString: string, password: string): Promise<T> {
  if (!password || password.trim().length === 0) {
    throw new Error('Bitte gib ein Passwort zur Entschlüsselung ein.');
  }

  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(encryptedJsonString);
  } catch {
    throw new Error('Die Datei hat kein gültiges Format.');
  }

  if (payload.version !== 1 || !payload.salt || !payload.iv || !payload.data) {
    throw new Error('Ungültiges Datenformat der Sicherungsdatei.');
  }

  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.data);

  try {
    const key = await deriveKey(password, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      key,
      ciphertext as BufferSource
    );

    const dec = new TextDecoder();
    const jsonString = dec.decode(decryptedBuffer);
    return JSON.parse(jsonString) as T;
  } catch {
    throw new Error('Entschlüsselung fehlgeschlagen: Falsches Passwort oder beschädigte Datei.');
  }
}
