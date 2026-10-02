/**
 * Typdefinitionen für das Badminton-Matchmaker-System
 */

/**
 * Spielerstärke auf einer Skala von 1 bis 10:
 * 1-3: Einsteiger / Hobby-Anfänger
 * 4-6: Solider Hobby-Spieler
 * 7-8: Fortgeschritten / ambitioniert
 * 9-10: Sehr stark / Liga-Niveau
 */
export type SkillLevel = number; // 1 bis 10

export interface Player {
  id: string;
  name: string;
  skill: SkillLevel; // 1 - 10
  isActive: boolean; // Aktives Mitglied oder pausierend
  createdAt: number;
}

/**
 * Anwesenheit und Runden-Auswahl eines Spielers für den aktuellen Abend
 */
export interface PlayerAttendance {
  playerId: string;
  rounds: {
    round1: boolean;
    round2: boolean;
    round3: boolean;
  };
}

/**
 * Ein Doppel-Paar (2 Spieler)
 */
export interface Team {
  player1: Player;
  player2: Player;
  averageSkill: number;
  totalSkill: number;
}

/**
 * Ein Doppel-Match auf einem Feld (Team 1 vs. Team 2)
 */
export interface Match {
  id: string;
  courtNumber: number; // Feld 1 bis 8
  team1: Team;
  team2: Team;
  roundType: 'peer' | 'mentor' | 'social'; // Peer = Starke mit Starken, Mentor = Stark+Schwach
  skillDiff: number; // Differenz der Team-Gesamtstärken (sollte minimal sein)
}

/**
 * Spieler, die in einer bestimmten Runde pausieren (z. B. bei Überhang)
 */
export interface RoundPlan {
  roundNumber: 1 | 2 | 3;
  roundType: 'peer' | 'mentor' | 'social';
  matches: Match[];
  restingPlayers: Player[]; // Pausierende Spieler
  trainerParticipated: boolean; // Ob der Trainer als Joker auf dem Feld steht
}

/**
 * Gesamtplan für einen Trainingsabend
 */
export interface SessionPlan {
  date: string; // YYYY-MM-DD
  rounds: [RoundPlan, RoundPlan, RoundPlan];
}

/**
 * Historien-Eintrag für eine gespielte Paarung, um Wiederholungen zu bestrafen
 */
export interface HistoricalPairing {
  date: string;
  roundNumber: number;
  partnerMap: Record<string, string>; // playerId -> partnerPlayerId
  opponentsMap: Record<string, string[]>; // playerId -> opponentPlayerIds
}

/**
 * Datenformat für verschlüsselten Export / Import
 */
export interface BackupData {
  version: '1.0';
  exportedAt: string;
  players: Player[];
  history: HistoricalPairing[];
  trainerSkill: number;
}
