/**
 * Paarungs- und Optimierungs-Engine für Badminton-Doppel
 * 
 * Beherrscht:
 * 1. Niveau-Gleichheit ('peer'): Starke mit Starken, Schwache mit Schwachen
 * 2. Lern-/Mentor-Modus ('mentor'): Stark+Schwach vs. Stark+Schwach (ausgeglichen)
 * 3. Sozialer Mix ('social'): Maximale Abwechslung und neue Konstellationen
 * 4. Trainer-Joker-Regel: Springt bei ungeraden Spielerzahlen ein
 * 5. Historien-Optimierung: Verhindert wiederholte Doppel-Partner und Gegner
 * 6. Faire Pausen-Rotation bei Überhang
 */

import { Player, Match, Team, RoundPlan, HistoricalPairing, SessionPlan } from '../types';

export const TRAINER_ID = 'trainer-joker';

/**
 * Erzeugt das virtuelle Spieler-Objekt für den Trainer als Joker
 */
export function getTrainerPlayer(trainerSkill: number = 7): Player {
  return {
    id: TRAINER_ID,
    name: 'Trainer (Joker)',
    skill: Math.max(1, Math.min(10, trainerSkill)),
    isActive: true,
    createdAt: 0
  };
}

export interface GenerateRoundOptions {
  roundNumber: 1 | 2 | 3;
  roundType: 'peer' | 'mentor' | 'social';
  players: Player[];
  attendanceMap: Record<string, { round1: boolean; round2: boolean; round3: boolean }>;
  trainerAvailable?: boolean;
  trainerSkill?: number;
  maxCourts?: number;
  historicalPairings?: HistoricalPairing[];
  previousRoundsCurrentSession?: RoundPlan[];
}

/**
 * Berechnet Strafpunkte für wiederholte Partnerschaften und Gegnerschaften
 */
function calculateHistoryPenalty(
  p1: Player,
  p2: Player,
  p3: Player,
  p4: Player,
  historicalPairings: HistoricalPairing[],
  previousRounds: RoundPlan[]
): number {
  let penalty = 0;

  // 1. Prüfung in den bereits gespielten Runden des HEUTIGEN Abends
  for (const prevRound of previousRounds) {
    for (const match of prevRound.matches) {
      const matchPlayerIds = [
        match.team1.player1.id,
        match.team1.player2.id,
        match.team2.player1.id,
        match.team2.player2.id
      ];

      // Gleiche Partner heute? (Sehr hohe Strafe: 120 Punkte)
      const t1TodaySame =
        (match.team1.player1.id === p1.id && match.team1.player2.id === p2.id) ||
        (match.team1.player1.id === p2.id && match.team1.player2.id === p1.id) ||
        (match.team2.player1.id === p1.id && match.team2.player2.id === p2.id) ||
        (match.team2.player1.id === p2.id && match.team2.player2.id === p1.id);

      const t2TodaySame =
        (match.team1.player1.id === p3.id && match.team1.player2.id === p4.id) ||
        (match.team1.player1.id === p4.id && match.team1.player2.id === p3.id) ||
        (match.team2.player1.id === p3.id && match.team2.player2.id === p4.id) ||
        (match.team2.player1.id === p4.id && match.team2.player2.id === p3.id);

      if (t1TodaySame) penalty += 120;
      if (t2TodaySame) penalty += 120;

      // Komplett gleiches 4er-Feld heute? (Zusatzstrafe: 40 Punkte)
      const overlapCount = [p1.id, p2.id, p3.id, p4.id].filter(id => matchPlayerIds.includes(id)).length;
      if (overlapCount >= 3) {
        penalty += 40;
      }
    }
  }

  // 2. Prüfung in der Historie früherer Trainingsabende (Vorwochen)
  for (const history of historicalPairings) {
    // Partner-Prüfung Vorwochen (Strafe: 40 Punkte)
    if (history.partnerMap[p1.id] === p2.id || history.partnerMap[p2.id] === p1.id) {
      penalty += 40;
    }
    if (history.partnerMap[p3.id] === p4.id || history.partnerMap[p4.id] === p3.id) {
      penalty += 40;
    }

    // Gegner-Prüfung Vorwochen (Strafe: 10 Punkte)
    if (history.opponentsMap[p1.id]?.includes(p3.id) || history.opponentsMap[p1.id]?.includes(p4.id)) {
      penalty += 10;
    }
  }

  return penalty;
}

/**
 * Erzeugt ein Team aus zwei Spielern inklusive Stärke-Berechnung
 */
function createTeam(p1: Player, p2: Player): Team {
  const total = p1.skill + p2.skill;
  return {
    player1: p1,
    player2: p2,
    totalSkill: total,
    averageSkill: Math.round((total / 2) * 10) / 10
  };
}

/**
 * Bestimmt die optimale 2vs2-Aufteilung aus 4 Spielern für ein Feld
 */
function findBestCourtMatch(
  courtNumber: number,
  fourPlayers: [Player, Player, Player, Player],
  roundType: 'peer' | 'mentor' | 'social',
  historicalPairings: HistoricalPairing[],
  previousRounds: RoundPlan[]
): Match {
  // Drei Kombinationsmöglichkeiten für 4 Spieler [0, 1, 2, 3]:
  // Option A: (0, 1) vs (2, 3)
  // Option B: (0, 2) vs (1, 3)
  // Option C: (0, 3) vs (1, 2)
  const combinations: [ [number, number], [number, number] ][] = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]]
  ];

  let bestMatch: Match | null = null;
  let lowestCost = Number.MAX_SAFE_INTEGER;

  for (const [t1Indices, t2Indices] of combinations) {
    const p1 = fourPlayers[t1Indices[0]];
    const p2 = fourPlayers[t1Indices[1]];
    const p3 = fourPlayers[t2Indices[0]];
    const p4 = fourPlayers[t2Indices[1]];

    const team1 = createTeam(p1, p2);
    const team2 = createTeam(p3, p4);
    const skillDiff = Math.abs(team1.totalSkill - team2.totalSkill);

    // Strafpunkte aus der Historie (Wiederholungen vermeiden)
    const historyPenalty = calculateHistoryPenalty(p1, p2, p3, p4, historicalPairings, previousRounds);

    // Bewertung je nach Modus:
    let cost = 0;
    if (roundType === 'peer') {
      // Im Peer-Modus zählt vor allem die Balance auf dem Feld
      cost = skillDiff * 30 + historyPenalty;
    } else if (roundType === 'mentor') {
      // Im Mentor-Modus soll jedes Team aus Stark + Schwach bestehen
      // Spreizung innerhalb des Teams belohnen, Skill-Differenz zwischen Teams minimieren
      const spread1 = Math.abs(p1.skill - p2.skill);
      const spread2 = Math.abs(p3.skill - p4.skill);
      // Wenn die Spreizung groß ist (Mentor-Charakter), sinkt der Score
      cost = skillDiff * 40 - (spread1 + spread2) * 10 + historyPenalty;
    } else {
      // Social Mix: Historie wiegt schwerer als reine Skill-Balance
      cost = skillDiff * 15 + historyPenalty * 1.5;
    }

    if (cost < lowestCost || bestMatch === null) {
      lowestCost = cost;
      bestMatch = {
        id: `match-r-c${courtNumber}-${p1.id}-${p2.id}-vs-${p3.id}-${p4.id}`,
        courtNumber,
        team1,
        team2,
        roundType,
        skillDiff
      };
    }
  }

  return bestMatch!;
}

/**
 * Wählt pausierende Spieler fair aus, wenn die Spielerzahl nicht durch 4 teilbar ist
 */
function selectRestingPlayers(
  pool: Player[],
  neededCount: number,
  previousRounds: RoundPlan[]
): { activePlayers: Player[]; restingPlayers: Player[] } {
  if (pool.length <= neededCount) {
    return { activePlayers: [...pool], restingPlayers: [] };
  }

  // Zähle, wie oft jeder Spieler an diesem Abend bereits pausiert hat
  const pauseCountMap = new Map<string, number>();
  for (const p of pool) {
    pauseCountMap.set(p.id, 0);
  }

  for (const round of previousRounds) {
    for (const resting of round.restingPlayers) {
      if (pauseCountMap.has(resting.id)) {
        pauseCountMap.set(resting.id, (pauseCountMap.get(resting.id) || 0) + 1);
      }
    }
  }

  // Spieler sortieren: Wer am wenigsten pausiert hat, pausiert als Nächstes bevorzugt
  // Bei Gleichstand: stabiler Zufall / ID
  const sorted = [...pool].sort((a, b) => {
    const pausesA = pauseCountMap.get(a.id) || 0;
    const pausesB = pauseCountMap.get(b.id) || 0;
    if (pausesA !== pausesB) {
      return pausesA - pausesB; // Wenigste Pausen zuerst
    }
    return a.name.localeCompare(b.name);
  });

  const restingCount = pool.length - neededCount;
  const restingPlayers = sorted.slice(0, restingCount);
  const restingIds = new Set(restingPlayers.map(p => p.id));
  const activePlayers = pool.filter(p => !restingIds.has(p.id));

  return { activePlayers, restingPlayers };
}

/**
 * Generiert die Paarungen für eine einzelne Runde (Runde 1, 2 oder 3)
 */
export function generateRoundPlan(options: GenerateRoundOptions): RoundPlan {
  const {
    roundNumber,
    roundType,
    players,
    attendanceMap,
    trainerAvailable = true,
    trainerSkill = 7,
    maxCourts = 8,
    historicalPairings = [],
    previousRoundsCurrentSession = []
  } = options;

  // 1. Anwesende Spieler für diese konkrete Runde filtern
  const roundKey = roundNumber === 1 ? 'round1' : roundNumber === 2 ? 'round2' : 'round3';
  const availablePlayers = players.filter(p => {
    if (!p.isActive) return false;
    const att = attendanceMap[p.id];
    return att ? att[roundKey] : true; // Standard: anwesend wenn nicht anders hinterlegt
  });

  let activePool = [...availablePlayers];
  let trainerParticipated = false;

  // 2. Trainer-Joker-Regel anwenden:
  // Wenn ungerade oder wenn mit Trainer eine volle 4er-Zahl erreicht wird:
  const isOdd = activePool.length % 2 !== 0;
  const completesFour = (activePool.length + 1) % 4 === 0;

  if (trainerAvailable && (isOdd || completesFour) && activePool.length >= 3) {
    const trainer = getTrainerPlayer(trainerSkill);
    activePool.push(trainer);
    trainerParticipated = true;
  }

  // 3. Maximale Feldbelegung berechnen (max 8 Felder = 32 Spieler)
  const maxPossibleCourts = Math.min(maxCourts, Math.floor(activePool.length / 4));
  const neededPlayerCount = maxPossibleCourts * 4;

  if (maxPossibleCourts === 0) {
    // Weniger als 4 Spieler verfügbar -> kein Doppel möglich
    return {
      roundNumber,
      roundType,
      matches: [],
      restingPlayers: availablePlayers,
      trainerParticipated: false
    };
  }

  // 4. Pausierende Spieler bestimmen (falls Überschuss)
  const { activePlayers, restingPlayers } = selectRestingPlayers(
    activePool,
    neededPlayerCount,
    previousRoundsCurrentSession
  );

  const matches: Match[] = [];

  // 5. Paarungs-Strategie nach Modus ausführen
  if (roundType === 'peer') {
    // -------------------------------------------------------------
    // MODUS: NIVEAU-GLEICHHEIT (Homogen)
    // Starke mit Starken, Schwächere mit Schwächeren
    // -------------------------------------------------------------
    // Spieler nach Stärke absteigend sortieren
    const sorted = [...activePlayers].sort((a, b) => b.skill - a.skill);

    // In 4er-Gruppen auf die Felder aufteilen
    for (let c = 0; c < maxPossibleCourts; c++) {
      const courtNumber = c + 1;
      const four = sorted.slice(c * 4, c * 4 + 4) as [Player, Player, Player, Player];
      const match = findBestCourtMatch(courtNumber, four, 'peer', historicalPairings, previousRoundsCurrentSession);
      matches.push(match);
    }
  } else if (roundType === 'mentor') {
    // -------------------------------------------------------------
    // MODUS: LERN- / MENTOR-RUNDE (Heterogen)
    // Stärkerer Spieler mit schwächerem Spieler gegen analoge Paarung
    // -------------------------------------------------------------
    const sorted = [...activePlayers].sort((a, b) => b.skill - a.skill);
    const count = sorted.length;
    const half = count / 2;

    const strongHalf = sorted.slice(0, half);
    const weakHalf = sorted.slice(half).reverse(); // Schwächste zuerst

    // Mentor-Teams bilden: Stärkster mit Schwächstem, 2. Stärkster mit 2. Schwächstem usw.
    const mentorTeams: Team[] = [];
    for (let i = 0; i < half; i++) {
      mentorTeams.push(createTeam(strongHalf[i], weakHalf[i]));
    }

    // Teams nach Summen-Stärke sortieren und benachbarte Teams auf ein Feld setzen
    mentorTeams.sort((a, b) => b.totalSkill - a.totalSkill);

    for (let c = 0; c < maxPossibleCourts; c++) {
      const courtNumber = c + 1;
      const team1 = mentorTeams[c * 2];
      const team2 = mentorTeams[c * 2 + 1];

      matches.push({
        id: `match-r${roundNumber}-c${courtNumber}-mentor`,
        courtNumber,
        team1,
        team2,
        roundType: 'mentor',
        skillDiff: Math.abs(team1.totalSkill - team2.totalSkill)
      });
    }
  } else {
    // -------------------------------------------------------------
    // MODUS: SOZIALER MIX (Abwechslung)
    // -------------------------------------------------------------
    // Leicht durchmischen, aber 4er-Gruppen bilden
    const sorted = [...activePlayers].sort((a, b) => b.skill - a.skill);
    for (let c = 0; c < maxPossibleCourts; c++) {
      const courtNumber = c + 1;
      const four = sorted.slice(c * 4, c * 4 + 4) as [Player, Player, Player, Player];
      const match = findBestCourtMatch(courtNumber, four, 'social', historicalPairings, previousRoundsCurrentSession);
      matches.push(match);
    }
  }

  return {
    roundNumber,
    roundType,
    matches,
    restingPlayers,
    trainerParticipated
  };
}

/**
 * Generiert einen kompletten Spielplan für alle drei Runden eines Trainingsabends
 * Standard-Dramaturgie:
 * Runde 1: Niveau-Gleichheit (Einspielen auf Augenhöhe)
 * Runde 2: Mentor-/Lern-Runde (Stark+Schwach für Entwicklung)
 * Runde 3: Ausgeglichen / Sozialer Abschluss-Mix
 */
export function generateFullSession(
  players: Player[],
  attendanceMap: Record<string, { round1: boolean; round2: boolean; round3: boolean }>,
  options: {
    trainerAvailable?: boolean;
    trainerSkill?: number;
    maxCourts?: number;
    historicalPairings?: HistoricalPairing[];
  } = {}
): SessionPlan {
  const today = new Date().toISOString().split('T')[0];

  // Runde 1: Niveau
  const r1 = generateRoundPlan({
    roundNumber: 1,
    roundType: 'peer',
    players,
    attendanceMap,
    ...options,
    previousRoundsCurrentSession: []
  });

  // Runde 2: Mentor
  const r2 = generateRoundPlan({
    roundNumber: 2,
    roundType: 'mentor',
    players,
    attendanceMap,
    ...options,
    previousRoundsCurrentSession: [r1]
  });

  // Runde 3: Sozialer Abschluss-Mix
  const r3 = generateRoundPlan({
    roundNumber: 3,
    roundType: 'social',
    players,
    attendanceMap,
    ...options,
    previousRoundsCurrentSession: [r1, r2]
  });

  return {
    date: today,
    rounds: [r1, r2, r3]
  };
}
