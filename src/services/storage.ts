/**
 * Persistenz- und Speicher-Service (LocalStorage & Verschlüsselter Backup-Transfer)
 * 
 * Ermöglicht 100 % Offline-Betrieb in der Sporthalle und sichere Datenübergabe
 * bei Trainer-Urlaub oder Krankheit an die Vertretung.
 */

import { Player, HistoricalPairing, BackupData, SessionPlan, TournamentConfig } from '../types';
import { encryptData, decryptData } from '../utils/crypto';
import LZString from 'lz-string';

const STORAGE_KEYS = {
  PLAYERS: 'badminton_players_v1',
  HISTORY: 'badminton_history_v1',
  TRAINER_SKILL: 'badminton_trainer_skill_v1',
  ACTIVE_SESSION: 'badminton_active_session_v1',
  TOURNAMENT: 'badminton_tournament_v1'
};

export interface ActiveSessionState {
  sessionPlan: SessionPlan | null;
  attendance: Record<string, { round1: boolean; round2: boolean; round3: boolean }>;
  activeRoundTab: 1 | 2 | 3;
  trainerAvailable: boolean;
}

/**
 * 42 anonymisierte Spieler des Vereins für den sofortigen Start
 */
export const DEFAULT_DEMO_PLAYERS: Player[] = [
  { id: 'p1', name: 'Siggi', skill: 7, isActive: true, createdAt: 1001 },
  { id: 'p2', name: 'Alex', skill: 9, isActive: true, createdAt: 1002 },
  { id: 'p3', name: 'Andrea', skill: 8, isActive: true, createdAt: 1003 },
  { id: 'p4', name: 'Anja', skill: 4, isActive: true, createdAt: 1004 },
  { id: 'p5', name: 'Beatrice', skill: 5, isActive: true, createdAt: 1005 },
  { id: 'p6', name: 'Carsten J.', skill: 7, isActive: true, createdAt: 1006 },
  { id: 'p7', name: 'Carsten S.', skill: 9, isActive: true, createdAt: 1007 },
  { id: 'p8', name: 'Claus', skill: 9, isActive: true, createdAt: 1008 },
  { id: 'p9', name: 'Dennis', skill: 10, isActive: true, createdAt: 1009 },
  { id: 'p10', name: 'Johannes', skill: 8, isActive: true, createdAt: 1010 },
  { id: 'p11', name: 'Eileen', skill: 6, isActive: true, createdAt: 1011 },
  { id: 'p12', name: 'Günther', skill: 6, isActive: true, createdAt: 1012 },
  { id: 'p13', name: 'Johanna', skill: 6, isActive: true, createdAt: 1013 },
  { id: 'p14', name: 'Jonas', skill: 8, isActive: true, createdAt: 1014 },
  { id: 'p15', name: 'Julia', skill: 6, isActive: true, createdAt: 1015 },
  { id: 'p16', name: 'Marc', skill: 5, isActive: true, createdAt: 1016 },
  { id: 'p17', name: 'Marcel', skill: 6, isActive: true, createdAt: 1017 },
  { id: 'p18', name: 'Nadin', skill: 6, isActive: true, createdAt: 1018 },
  { id: 'p19', name: 'Raphael', skill: 8, isActive: true, createdAt: 1019 },
  { id: 'p20', name: 'Rene', skill: 7, isActive: true, createdAt: 1020 },
  { id: 'p21', name: 'Ron', skill: 5, isActive: true, createdAt: 1021 },
  { id: 'p22', name: 'Sara', skill: 4, isActive: true, createdAt: 1022 },
  { id: 'p23', name: 'Simone', skill: 5, isActive: true, createdAt: 1023 },
  { id: 'p24', name: 'Sonja', skill: 4, isActive: true, createdAt: 1024 },
  { id: 'p25', name: 'Steffen', skill: 10, isActive: true, createdAt: 1025 },
  { id: 'p26', name: 'Susanne', skill: 6, isActive: true, createdAt: 1026 },
  { id: 'p27', name: 'Svenja', skill: 5, isActive: true, createdAt: 1027 },
  { id: 'p28', name: 'Timo', skill: 10, isActive: true, createdAt: 1028 },
  { id: 'p29', name: 'Lena', skill: 4, isActive: true, createdAt: 1029 },
  { id: 'p30', name: 'Fabio', skill: 4, isActive: true, createdAt: 1030 },
  { id: 'p31', name: 'Florian', skill: 4, isActive: true, createdAt: 1031 },
  { id: 'p32', name: 'Jens', skill: 4, isActive: true, createdAt: 1032 },
  { id: 'p33', name: 'Jihan', skill: 4, isActive: true, createdAt: 1033 },
  { id: 'p34', name: 'Justin', skill: 9, isActive: true, createdAt: 1034 },
  { id: 'p35', name: 'Nasser', skill: 5, isActive: true, createdAt: 1035 },
  { id: 'p36', name: 'Felix', skill: 6, isActive: true, createdAt: 1036 },
  { id: 'p37', name: 'Robin', skill: 8, isActive: true, createdAt: 1037 },
  { id: 'p38', name: 'Tobi', skill: 6, isActive: true, createdAt: 1038 },
  { id: 'p39', name: 'Nils', skill: 10, isActive: true, createdAt: 1039 },
  { id: 'p40', name: 'Lisa', skill: 4, isActive: true, createdAt: 1040 },
  { id: 'p41', name: 'Nico', skill: 9, isActive: true, createdAt: 1041 },
  { id: 'p42', name: 'Toni', skill: 8, isActive: true, createdAt: 1042 }
];

/**
 * Lädt die Spielerliste aus dem LocalStorage.
 * Falls leer oder veralteter 16er-Demo-Kader vorhanden, wird der neue 42er-Kader geladen.
 */
export function loadPlayers(): Player[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!raw) {
      savePlayers(DEFAULT_DEMO_PLAYERS);
      return DEFAULT_DEMO_PLAYERS;
    }
    const parsed: Player[] = JSON.parse(raw);
    // Sanfte automatische Migration: Falls noch der alte generische 16er-Demo-Kader im LocalStorage liegt
    if (parsed.length === 16 && parsed[0]?.name === 'Alex M.' && parsed[15]?.name === 'Petra G.') {
      savePlayers(DEFAULT_DEMO_PLAYERS);
      return DEFAULT_DEMO_PLAYERS;
    }
    return parsed;
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
 * Standard-Konfiguration für den Turniermodus
 */
export const DEFAULT_TOURNAMENT_CONFIG: TournamentConfig = {
  isActive: false,
  type: 'doubles',
  pairs: [],
  schleifchenPlayerIds: []
};

/**
 * Lädt die Turnier-Konfiguration.
 * Deaktiviert den Turniermodus automatisch, wenn das Turnierdatum in der Vergangenheit liegt.
 */
export function loadTournamentConfig(): TournamentConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TOURNAMENT);
    if (!raw) return { ...DEFAULT_TOURNAMENT_CONFIG };
    const config: TournamentConfig = JSON.parse(raw);

    // Automatische Deaktivierung nach Ablauf des Turniertages
    if (config.isActive && config.tournamentDate) {
      const today = new Date().toISOString().split('T')[0];
      if (config.tournamentDate < today) {
        config.isActive = false;
        saveTournamentConfig(config);
      }
    }
    return {
      isActive: Boolean(config.isActive),
      type: config.type || 'doubles',
      tournamentDate: config.tournamentDate || '',
      title: config.title || '',
      pairs: Array.isArray(config.pairs) ? config.pairs : [],
      schleifchenPlayerIds: Array.isArray(config.schleifchenPlayerIds) ? config.schleifchenPlayerIds : []
    };
  } catch (err) {
    console.error('Fehler beim Laden der Turnier-Konfiguration:', err);
    return { ...DEFAULT_TOURNAMENT_CONFIG };
  }
}

/**
 * Speichert die Turnier-Konfiguration
 */
export function saveTournamentConfig(config: TournamentConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TOURNAMENT, JSON.stringify(config));
  } catch (err) {
    console.error('Fehler beim Speichern der Turnier-Konfiguration:', err);
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
    trainerSkill: loadTrainerSkill(),
    tournamentConfig: loadTournamentConfig()
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
  if (data.tournamentConfig) {
    saveTournamentConfig(data.tournamentConfig);
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
  saveTournamentConfig(DEFAULT_TOURNAMENT_CONFIG);
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

export const QR_TRANSFER_PREFIX = 'BMM:1:';

/**
 * Erzeugt einen ultrakompakten, komprimierten QR-Code-Payload für die direkte
 * Urlaubsübergabe von Smartphone zu Smartphone via Display-Scan.
 */
export function generateCompactQRPayload(): string {
  const players = loadPlayers();
  const history = loadHistory();
  const trainerSkill = loadTrainerSkill();
  const tournamentConfig = loadTournamentConfig();

  // Kompakter Spieler-Datensatz: [id, name, skill, skillAdjustment, isActive, isGuest, invitedByPlayerId]
  const compactPlayers = players.map(p => [
    p.id,
    p.name,
    p.skill,
    p.skillAdjustment ?? 0,
    p.isActive ? 1 : 0,
    p.isGuest ? 1 : 0,
    p.invitedByPlayerId || ''
  ]);

  // Neueste Historie (bis zu 12 Einheiten / 36 Runden reichen für Wiederholungs-Strafen vollkommen aus)
  const recentHistory = history.slice(-12).map(h => [
    h.date,
    h.roundNumber,
    Object.entries(h.partnerMap || {}),
    Object.entries(h.opponentsMap || {})
  ]);

  // Turniermodus (falls konfiguriert)
  const compactTournament = tournamentConfig.isActive ? {
    a: true,
    t: tournamentConfig.type === 'schleifchen' ? 's' : 'd',
    d: tournamentConfig.tournamentDate || '',
    n: tournamentConfig.title || '',
    p: (tournamentConfig.pairs || []).map(pair => [pair.player1Id, pair.player2Id]),
    s: tournamentConfig.schleifchenPlayerIds || []
  } : undefined;

  const payload = {
    v: 1,
    t: Date.now(),
    ts: trainerSkill,
    p: compactPlayers,
    h: recentHistory,
    tc: compactTournament
  };

  const json = JSON.stringify(payload);
  const compressed = LZString.compressToBase64(json);
  return `${QR_TRANSFER_PREFIX}${compressed}`;
}

/**
 * Liest einen gescannten QR-Code-String ein, dekomprimiert die Daten und übernimmt
 * sie in den lokalen Speicher.
 */
export function parseAndImportCompactQRPayload(qrString: string): {
  playersCount: number;
  historyCount: number;
  tournamentImported: boolean;
} {
  const trimmed = qrString.trim();
  if (!trimmed.startsWith(QR_TRANSFER_PREFIX)) {
    throw new Error('Ungültiger QR-Code. Bitte scanne den Übergabe-Code aus der Badminton Matchmaker App.');
  }

  const base64Data = trimmed.slice(QR_TRANSFER_PREFIX.length);
  const decompressed = LZString.decompressFromBase64(base64Data);

  if (!decompressed) {
    throw new Error('Die Daten im QR-Code konnten nicht dekomprimiert werden.');
  }

  let payload: any;
  try {
    payload = JSON.parse(decompressed);
  } catch {
    throw new Error('Der Inhalt des QR-Codes ist beschädigt.');
  }

  if (!payload || payload.v !== 1 || !Array.isArray(payload.p)) {
    throw new Error('Das Datenformat im QR-Code ist nicht kompatibel.');
  }

  // 1. Spieler wiederherstellen
  const players: Player[] = payload.p.map((item: any[]) => {
    const [id, name, skill, skillAdjustment, isActive, isGuest, invitedByPlayerId] = item;
    return {
      id: String(id),
      name: String(name),
      skill: Number(skill),
      skillAdjustment: skillAdjustment ? Number(skillAdjustment) : undefined,
      isActive: Boolean(isActive),
      isGuest: Boolean(isGuest),
      invitedByPlayerId: invitedByPlayerId ? String(invitedByPlayerId) : undefined,
      createdAt: Date.now()
    };
  });

  savePlayers(players);

  // 2. Trainer-Stärke
  if (typeof payload.ts === 'number') {
    saveTrainerSkill(payload.ts);
  }

  // 3. Historie wiederherstellen
  let historyCount = 0;
  if (Array.isArray(payload.h)) {
    const restoredHistory: HistoricalPairing[] = payload.h.map((hItem: any[]) => {
      const [date, roundNumber, partnerEntries, opponentEntries] = hItem;
      return {
        date: String(date),
        roundNumber: Number(roundNumber),
        partnerMap: Object.fromEntries(partnerEntries || []),
        opponentsMap: Object.fromEntries(opponentEntries || [])
      };
    });
    saveHistory(restoredHistory);
    historyCount = restoredHistory.length;
  }

  // 4. Turniermodus
  let tournamentImported = false;
  if (payload.tc) {
    const tc = payload.tc;
    saveTournamentConfig({
      isActive: Boolean(tc.a),
      type: tc.t === 's' ? 'schleifchen' : 'doubles',
      tournamentDate: tc.d || '',
      title: tc.n || '',
      pairs: Array.isArray(tc.p)
        ? tc.p.map((pPair: [string, string], idx: number) => ({
            id: `qr-tp-${idx}`,
            player1Id: pPair[0],
            player2Id: pPair[1]
          }))
        : [],
      schleifchenPlayerIds: Array.isArray(tc.s) ? tc.s : []
    });
    tournamentImported = Boolean(tc.a);
  }

  return {
    playersCount: players.length,
    historyCount,
    tournamentImported
  };
}
