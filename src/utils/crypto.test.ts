import { describe, it, expect } from 'vitest';
import { encryptData, decryptData } from './crypto';

describe('Verschlüsselung (Web Crypto AES-GCM)', () => {
  const sampleData = {
    players: [
      { id: '1', name: 'Max Mustermann', skill: 7 },
      { id: '2', name: 'Erika Musterfrau', skill: 4 }
    ],
    secretNote: 'Hobbygruppe Donnerstag'
  };

  it('sollte Daten erfolgreich mit einem Passwort verschlüsseln und entschlüsseln', async () => {
    const password = 'GeheimesTrainingsPasswort123!';
    const encrypted = await encryptData(sampleData, password);

    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toContain('Max Mustermann'); // Keine Klartext-Namen!
    expect(encrypted).toContain('"version": 1');
    expect(encrypted).toContain('"salt":');
    expect(encrypted).toContain('"iv":');
    expect(encrypted).toContain('"data":');

    const decrypted = await decryptData<typeof sampleData>(encrypted, password);
    expect(decrypted).toEqual(sampleData);
  });

  it('sollte bei falschem Passwort einen Fehler werfen', async () => {
    const password = 'KorrektesPasswort';
    const encrypted = await encryptData(sampleData, password);

    await expect(decryptData(encrypted, 'FalschesPasswort')).rejects.toThrow(
      'Entschlüsselung fehlgeschlagen: Falsches Passwort oder beschädigte Datei.'
    );
  });

  it('sollte bei leerem Passwort die Verschlüsselung verweigern', async () => {
    await expect(encryptData(sampleData, '')).rejects.toThrow('Das Passwort darf nicht leer sein.');
  });

  it('sollte bei manipulierter Datei die Entschlüsselung abbrechen', async () => {
    const password = 'TestPasswort';
    const encrypted = await encryptData(sampleData, password);
    const parsed = JSON.parse(encrypted);
    // Verfälsche ein Zeichen im Ciphertext
    parsed.data = parsed.data.substring(0, parsed.data.length - 4) + 'AAAA';

    await expect(decryptData(JSON.stringify(parsed), password)).rejects.toThrow(
      'Entschlüsselung fehlgeschlagen'
    );
  });
});
