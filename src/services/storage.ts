/**
 * Persistenz- und Speicher-Service (LocalStorage & Verschlüsselter Backup-Transfer)
 * 
 * Ermöglicht 100 % Offline-Betrieb in der Sporthalle und sichere Datenübergabe
 * bei Trainer-Urlaub oder Krankheit an die Vertretung.
 */

import { Player, HistoricalPairing, BackupData, SessionPlan } from '../types';
import { encryptData, decryptData } from '../utils/crypto';

const STORAGE_KEYS = {
  PLAYERS: 'badminton_players_v1',
  HISTORY: 'badminton_history_v1',
  TRAINER_SKILL: 'badminton_trainer_skill_v1',
  ACTIVE_SESSION: 'badminton_active_session_v1'
};

export interface ActiveSessionState {
  sessionPlan: SessionPlan | null;
  attendance: Record<string, { round1: boolean; round2: boolean; round3: boolean }>;
  activeRoundTab: 1 | 2 | 3;
  trainerAvailable: boolean;
}

/**
 * 16 realistische Demo-Spieler für den schnellen Start ohne manuelles Tippen
 */
export const DEFAULT_DEMO_PLAYERS: Player[] = [
  { id: 'p1', name: 'Alex M.', skill: 9, isActive: true, createdAt: 1001 },
  { id: 'p2', name: 'Bastian K.', skill: 8, isActive: true, createdAt: 1002 },
  { id: 'p3', name: 'Christian W.', skill: 8, isActive: true, createdAt: 1003 },
  { id: 'p4', name: 'Dirk S.', skill: 7, isActive: true, createdAt: 1004 },
  { id: 'p5', name: 'Elena R.', skill: 7, isActive: true, createdAt: 1005 },
  { id: 'p6', name: 'Fabian H.', skill: 6, isActive: true, createdAt: 1006 },
  { id: 'p7', name: 'Gregor B.', skill: 6, isActive: true, createdAt: 1007 },
  { id: 'p8', name: 'Hanna L.', skill: 5, isActive: true, createdAt: 1008 },
  { id: 'p9', name: 'Ines T.', skill: 5, isActive: true, createdAt: 1009 },
  { id: 'p10', name: 'Jan P.', skill: 4, isActive: true, createdAt: 1010 },
  { id: 'p11', name: 'Klaus D.', skill: 4, isActive: true, createdAt: 1011 },
  { id: 'p12', name: 'Laura M.', skill: 3, isActive: true, createdAt: 1012 },
  { id: 'p13', name: 'Markus V.', skill: 3, isActive: true, createdAt: 1013 },
  { id: 'p14', name: 'Nina K.', skill: 3, isActive: true, createdAt: 1014 },
  { id: 'p15', name: 'Oliver F.', skill: 2, isActive: true, createdAt: 1015 },
  { id: 'p16', name: 'Petra G.', skill: 2, isActive: true, createdAt: 1016 }
];

/**
 * Lädt die Spielerliste aus dem LocalStorage.
 * Falls leer, werden die Demo-Spieler initialisiert.
 */
export function loadPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!raw) {
      savePlayers(DEFAULT_DEMO_PLAYERS);
      return DEFAULT_DEMO_PLAYERS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Fehler beim Laden der Spielerdaten:', err);
    return DEFAULT_DEMO_PLAYERS;
  }
}

/**
 * Speichert die Spielerliste im LocalStorage
 */
export function savePlayers(players: Player[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  } catch (err) {
    console.error('Fehler beim Speichern der Spielerdaten:', err);
  }
}

/**
 * Lädt die Historie früherer Paarungen
 */
export function loadHistory(): HistoricalPairing[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Speichert die Paarungs-Historie
 */
export function saveHistory(history: HistoricalPairing[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (err) {
    console.error('Fehler beim Speichern der Historie:', err);
  }
}

/**
 * Lädt die eingestellte Spielstärke des Trainers (1-10)
 */
export function loadTrainerSkill(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRAINER_SKILL);
    return raw ? parseInt(raw, 10) : 7;
  } catch {
    return 7;
  }
}

/**
 * Speichert die Spielstärke des Trainers
 */
export function saveTrainerSkill(skill: number): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRAINER_SKILL, skill.toString());
  } catch (err) {
    console.error('Fehler beim Speichern der Trainer-Stärke:', err);
  }
}

/**
 * Exportiert den gesamten Datenbestand verschlüsselt mit einem Passwort
 */
export async function exportEncryptedBackup(password: string): Promise<string> {
  const backup: BackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    players: loadPlayers(),
    history: loadHistory(),
    trainerSkill: loadTrainerSkill()
  };

  return await encryptData(backup, password);
}

/**
 * Entschlüsselt eine Backup-Datei und übernimmt die Daten in den lokalen Speicher
 */
export async function importEncryptedBackup(
  encryptedPayload: string,
  password: string
): Promise<{ playersCount: number; historyCount: number }> {
  const data = await decryptData<BackupData>(encryptedPayload, password);

  if (!data || !Array.isArray(data.players)) {
    throw new Error('Die Sicherungsdatei enthält keine gültigen Spielerdaten.');
  }

  savePlayers(data.players);
  if (Array.isArray(data.history)) {
    saveHistory(data.history);
  }
  if (typeof data.trainerSkill === 'number') {
    saveTrainerSkill(data.trainerSkill);
  }

  return {
    playersCount: data.players.length,
    historyCount: data.history ? data.history.length : 0
  };
}

/**
 * Setzt die Daten auf den Auslieferungszustand (Demo-Spieler) zurück
 */
export function resetToDemo(): void {
  savePlayers(DEFAULT_DEMO_PLAYERS);
  saveHistory([]);
  saveTrainerSkill(7);
  clearActiveSession();
}

/**
 * Lädt die aktive Trainingssitzung (Spielplan + Anwesenheit)
 */
export function loadActiveSession(): ActiveSessionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Speichert den aktuellen Status des Trainingsabends (Spielplan + Anwesenheit)
 */
export function saveActiveSession(state: ActiveSessionState): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(state));
  } catch (err) {
    console.error('Fehler beim Speichern der aktiven Sitzung:', err);
  }
}

/**
 * Löscht die aktive Trainingssitzung für einen neuen Abend
 */
export function clearActiveSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  } catch (err) {
    console.error('Fehler beim Zurücksetzen der Sitzung:', err);
  }
}
