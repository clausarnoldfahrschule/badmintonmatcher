/**
 * Paarungs- und Optimierungs-Engine für Badminton-Doppel & Einzel
 * 
 * Beherrscht:
 * 1. Niveau-Gleichheit ('peer'): Starke mit Starken, Schwache mit Schwachen
 * 2. Lern-/Mentor-Modus ('mentor'): Stark+Schwach vs. Stark+Schwach mit Historien-Schutz
 * 3. Sozialer Mix ('social'): Felderübergreifende Durchmischung (Snake-Verteilung)
 * 4. Trainer-Joker-Regel: Springt bei ungeraden Spielerzahlen ein (sofern Halle nicht voll)
 * 5. Einzel-Regel: Bei 2 Restspielern wird ein 1vs1-Match auf freiem Feld angesetzt (mit Rotation)
 * 6. Historien-Optimierung: Verhindert wiederholte Doppel-Partner und Gegner
 * 7. Faire Pausen-Rotation bei Überhang
 */

import { Player, Match, Team, RoundPlan, HistoricalPairing, SessionPlan, SinglesMatch } from '../types';

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
 * 
 * @param p1 Erster Spieler Team 1
 * @param p2 Zweiter Spieler Team 1
 * @param p3 Erster Spieler Team 2
 * @param p4 Zweiter Spieler Team 2
 * @param historicalPairings Historie früherer Trainingsabende
 * @param previousRounds Bisherige Runden des aktuellen Abends
 * @returns Strafpunkte (höher = schlechtere Paarung)
 */
export function calculateHistoryPenalty(
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
export function createTeam(p1: Player, p2: Player): Team {
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
export function findBestCourtMatch(
  roundNumber: number,
  courtNumber: number,
  fourPlayers: [Player, Player, Player, Player],
  roundType: 'peer' | 'social',
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

    let cost = 0;
    if (roundType === 'peer') {
      // Im Peer-Modus zählt vor allem die Balance auf dem Feld
      cost = skillDiff * 30 + historyPenalty;
    } else {
      // Im Social Mix: Historie und Abwechslung wiegen deutlich schwerer
      cost = skillDiff * 15 + historyPenalty * 1.5;
    }

    if (cost < lowestCost || bestMatch === null) {
      lowestCost = cost;
      bestMatch = {
        id: `match-r${roundNumber}-c${courtNumber}-${p1.id}-${p2.id}-vs-${p3.id}-${p4.id}`,
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
 * Wählt pausierende Spieler fair aus, wenn die Spielerzahl nicht aufgeteilt werden kann
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
  const sorted = [...pool].sort((a, b) => {
    const pausesA = pauseCountMap.get(a.id) || 0;
    const pausesB = pauseCountMap.get(b.id) || 0;
    if (pausesA !== pausesB) {
      return pausesA - pausesB;
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
 * Ermittelt zwei geeignete Spieler für ein 1vs1-Einzel, wenn 2 Spieler übrig sind.
 * - Schließt den Trainer-Joker vom Einzel aus
 * - Bevorzugt Spieler, die heute noch kein Einzel gespielt haben (Rotation)
 * - Wählt unter den Kandidaten das Paar mit geringster Stärkedifferenz
 */
function selectSinglesPlayers(
  pool: Player[],
  roundType: 'peer' | 'mentor' | 'social',
  previousRounds: RoundPlan[]
): [Player, Player] | null {
  // Trainer darf niemals im Einzel spielen
  const candidates = pool.filter(p => p.id !== TRAINER_ID);
  if (candidates.length < 2) return null;

  // Im Peer-Modus (Niveau-Gleichheit): Die beiden Spieler am unteren Ende der Rangliste
  // bilden das Zusatzfeld, damit die stärkeren Spieler auf den vorderen Feldern Doppel spielen
  if (roundType === 'peer') {
    const sorted = [...candidates].sort((a, b) => b.skill - a.skill);
    return [sorted[sorted.length - 2], sorted[sorted.length - 1]];
  }

  // Zähle bisherige Einzel-Teilnahmen am heutigen Abend
  const singlesCountMap = new Map<string, number>();
  for (const p of candidates) {
    singlesCountMap.set(p.id, 0);
  }

  for (const round of previousRounds) {
    if (round.singlesMatch) {
      const id1 = round.singlesMatch.player1.id;
      const id2 = round.singlesMatch.player2.id;
      if (singlesCountMap.has(id1)) singlesCountMap.set(id1, singlesCountMap.get(id1)! + 1);
      if (singlesCountMap.has(id2)) singlesCountMap.set(id2, singlesCountMap.get(id2)! + 1);
      if (round.singlesMatch.player3) {
        const id3 = round.singlesMatch.player3.id;
        if (singlesCountMap.has(id3)) singlesCountMap.set(id3, singlesCountMap.get(id3)! + 1);
      }
    }
  }

  // Filtere nach Spielern mit den wenigsten Einzel-Einsätzen
  const minSinglesCount = Math.min(...candidates.map(p => singlesCountMap.get(p.id) || 0));
  const preferredCandidates = candidates.filter(p => (singlesCountMap.get(p.id) || 0) === minSinglesCount);

  const selectionPool = preferredCandidates.length >= 2 ? preferredCandidates : candidates;

  // Suche in der Auswahl das Paar mit geringstem Unterschied
  let bestPair: [Player, Player] | null = null;
  let minDiff = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i < selectionPool.length; i++) {
    for (let j = i + 1; j < selectionPool.length; j++) {
      const diff = Math.abs(selectionPool[i].skill - selectionPool[j].skill);
      if (diff < minDiff) {
        minDiff = diff;
        bestPair = [selectionPool[i], selectionPool[j]];
      }
    }
  }

  return bestPair;
}

/**
 * Erzeugt ausgewogene Mentor-Paare (Stark+Schwach) unter Berücksichtigung von Historien-Strafen
 */
function generateMentorMatches(
  roundNumber: number,
  players: Player[],
  courtCount: number,
  historicalPairings: HistoricalPairing[],
  previousRounds: RoundPlan[]
): Match[] {
  const sorted = [...players].sort((a, b) => b.skill - a.skill);
  const half = sorted.length / 2;
  const strongHalf = sorted.slice(0, half);
  const weakHalf = sorted.slice(half);

  // Suche für jeden starken Spieler den besten Partner aus der schwachen Hälfte,
  // der noch nicht mit ihm gespielt hat (geringste Historien-Strafe)
  const availableWeak = [...weakHalf];
  const mentorTeams: Team[] = [];

  for (let i = 0; i < strongHalf.length; i++) {
    const strong = strongHalf[i];
    let bestWeakIndex = 0;
    let lowestPartnerPenalty = Number.MAX_SAFE_INTEGER;

    for (let j = 0; j < availableWeak.length; j++) {
      const candidateWeak = availableWeak[j];
      let penalty = 0;

      // Partner in heutigen Vorrunden?
      for (const pr of previousRounds) {
        for (const m of pr.matches) {
          const isPartner =
            (m.team1.player1.id === strong.id && m.team1.player2.id === candidateWeak.id) ||
            (m.team1.player1.id === candidateWeak.id && m.team1.player2.id === strong.id) ||
            (m.team2.player1.id === strong.id && m.team2.player2.id === candidateWeak.id) ||
            (m.team2.player1.id === candidateWeak.id && m.team2.player2.id === strong.id);
          if (isPartner) penalty += 150;
        }
      }

      // Partner in früheren Wochen?
      for (const hp of historicalPairings) {
        if (hp.partnerMap[strong.id] === candidateWeak.id || hp.partnerMap[candidateWeak.id] === strong.id) {
          penalty += 50;
        }
      }

      // Bevorzuge reziproke Sortierung als Tie-Breaker (Stärkster mit Schwächstem)
      const idealWeakIndex = availableWeak.length - 1 - i;
      const indexDiff = Math.abs(j - Math.max(0, idealWeakIndex));
      const totalCost = penalty + indexDiff * 5;

      if (totalCost < lowestPartnerPenalty) {
        lowestPartnerPenalty = totalCost;
        bestWeakIndex = j;
      }
    }

    const chosenWeak = availableWeak.splice(bestWeakIndex, 1)[0];
    mentorTeams.push(createTeam(strong, chosenWeak));
  }

  // Sortiere Teams nach Gesamtstärke und setze benachbarte Teams auf ein Feld
  mentorTeams.sort((a, b) => b.totalSkill - a.totalSkill);

  const matches: Match[] = [];
  for (let c = 0; c < courtCount; c++) {
    const courtNumber = c + 1;
    const team1 = mentorTeams[c * 2];
    const team2 = mentorTeams[c * 2 + 1];

    matches.push({
      id: `match-r${roundNumber}-c${courtNumber}-mentor-${team1.player1.id}-${team1.player2.id}-vs-${team2.player1.id}-${team2.player2.id}`,
      courtNumber,
      team1,
      team2,
      roundType: 'mentor',
      skillDiff: Math.abs(team1.totalSkill - team2.totalSkill)
    });
  }

  return matches;
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
    return att ? att[roundKey] : true;
  });

  let activePool = [...availablePlayers];
  let trainerParticipated = false;

  // 2. Trainer-Joker-Regel anwenden:
  // Nur einwechseln, wenn Spielerzahl ungerade ist UND die Halle nicht bereits voll ausgelastet ist
  const isOdd = activePool.length % 2 !== 0;
  const maxCapacity = maxCourts * 4;

  if (trainerAvailable && isOdd && activePool.length >= 3 && activePool.length < maxCapacity) {
    const trainer = getTrainerPlayer(trainerSkill);
    activePool.push(trainer);
    trainerParticipated = true;
  }

  // 3. Maximale Feldbelegung berechnen (Doppel + optionales 1vs1 Einzel)
  let maxPossibleDoublesCourts = Math.min(maxCourts, Math.floor(activePool.length / 4));
  let hasSingles = false;

  const remainder = activePool.length - (maxPossibleDoublesCourts * 4);
  if (remainder >= 2 && maxPossibleDoublesCourts < maxCourts) {
    hasSingles = true;
  } else if (maxPossibleDoublesCourts === 0 && activePool.length >= 2 && maxCourts >= 1) {
    hasSingles = true;
  }

  const neededPlayerCount = (maxPossibleDoublesCourts * 4) + (hasSingles ? 2 : 0);

  if (neededPlayerCount === 0) {
    return {
      roundNumber,
      roundType,
      matches: [],
      singlesMatch: null,
      restingPlayers: availablePlayers,
      trainerParticipated: false
    };
  }

  // 4. Pausierende Spieler bestimmen (falls nach Doppel + Einzel noch Überhang)
  const { activePlayers, restingPlayers } = selectRestingPlayers(
    activePool,
    neededPlayerCount,
    previousRoundsCurrentSession
  );

  let poolForDoubles = [...activePlayers];
  let singlesMatch: SinglesMatch | null = null;

  // 5. Einzel- bzw. Trainer-Challenge-Paarung ermitteln (mit Trainer-Ausschluss und Historien-Rotation)
  if (hasSingles) {
    const singlesPair = selectSinglesPlayers(activePlayers, roundType, previousRoundsCurrentSession);
    if (singlesPair) {
      const [s1, s2] = singlesPair;
      const singlesCourtNumber = maxPossibleDoublesCourts + 1;

      // Sonderregel: Unteres Drittel der Skala (Stärke <= 3).
      // Ein reines Einzel zwischen zwei Anfängern ist unüblich.
      // Wenn der Trainer verfügbar ist, spielt er alleine gegen die zwei Anfänger (1 vs. 2 Trainer-Challenge)!
      const bothBeginners = s1.skill <= 3 && s2.skill <= 3;

      if (bothBeginners && trainerAvailable) {
        const trainer = getTrainerPlayer(trainerSkill);
        trainerParticipated = true;
        singlesMatch = {
          id: `match-r${roundNumber}-c${singlesCourtNumber}-challenge-trainer-vs-${s1.id}-${s2.id}`,
          courtNumber: singlesCourtNumber,
          isTrainerChallenge: true,
          player1: trainer,
          player2: s1,
          player3: s2,
          skillDiff: Math.abs(trainer.skill - (s1.skill + s2.skill))
        };
      } else {
        singlesMatch = {
          id: `match-r${roundNumber}-c${singlesCourtNumber}-singles-${s1.id}-vs-${s2.id}`,
          courtNumber: singlesCourtNumber,
          isTrainerChallenge: false,
          player1: s1,
          player2: s2,
          skillDiff: Math.abs(s1.skill - s2.skill)
        };
      }

      poolForDoubles = activePlayers.filter(p => p.id !== s1.id && p.id !== s2.id);
    }
  }

  const matches: Match[] = [];

  // 6. Doppel-Paarungs-Strategie nach Modus ausführen
  if (maxPossibleDoublesCourts > 0) {
    if (roundType === 'peer') {
      // -------------------------------------------------------------
      // MODUS: NIVEAU-GLEICHHEIT (Homogen)
      // Starke mit Starken, Schwächere mit Schwächeren
      // -------------------------------------------------------------
      const sorted = [...poolForDoubles].sort((a, b) => b.skill - a.skill);

      for (let c = 0; c < maxPossibleDoublesCourts; c++) {
        const courtNumber = c + 1;
        const four = sorted.slice(c * 4, c * 4 + 4) as [Player, Player, Player, Player];
        const match = findBestCourtMatch(
          roundNumber,
          courtNumber,
          four,
          'peer',
          historicalPairings,
          previousRoundsCurrentSession
        );
        matches.push(match);
      }
    } else if (roundType === 'mentor') {
      // -------------------------------------------------------------
      // MODUS: LERN- / MENTOR-RUNDE (Heterogen mit Historien-Schutz)
      // -------------------------------------------------------------
      matches.push(
        ...generateMentorMatches(
          roundNumber,
          poolForDoubles,
          maxPossibleDoublesCourts,
          historicalPairings,
          previousRoundsCurrentSession
        )
      );
    } else {
      // -------------------------------------------------------------
      // MODUS: SOZIALER MIX (Felderübergreifende Snake-Durchmischung)
      // -------------------------------------------------------------
      const sorted = [...poolForDoubles].sort((a, b) => b.skill - a.skill);
      const courtBuckets: Player[][] = Array.from({ length: maxPossibleDoublesCourts }, () => []);

      let cIdx = 0;
      let dir = 1;
      for (const p of sorted) {
        courtBuckets[cIdx].push(p);
        cIdx += dir;
        if (cIdx >= maxPossibleDoublesCourts) {
          cIdx = maxPossibleDoublesCourts - 1;
          dir = -1;
        } else if (cIdx < 0) {
          cIdx = 0;
          dir = 1;
        }
      }

      for (let c = 0; c < maxPossibleDoublesCourts; c++) {
        const courtNumber = c + 1;
        const four = courtBuckets[c] as [Player, Player, Player, Player];
        const match = findBestCourtMatch(
          roundNumber,
          courtNumber,
          four,
          'social',
          historicalPairings,
          previousRoundsCurrentSession
        );
        matches.push(match);
      }
    }
  }

  return {
    roundNumber,
    roundType,
    matches,
    singlesMatch,
    restingPlayers,
    trainerParticipated
  };
}

/**
 * Generiert einen kompletten Spielplan für alle drei Runden eines Trainingsabends
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

/**
 * Wandelt einen abgeschlossenen Spielplan in historische Paarungs-Einträge um,
 * damit sie dauerhaft im LocalStorage gespeichert werden können.
 */
export function sessionPlanToHistoricalPairings(plan: SessionPlan): HistoricalPairing[] {
  const pairings: HistoricalPairing[] = [];

  for (const round of plan.rounds) {
    const partnerMap: Record<string, string> = {};
    const opponentsMap: Record<string, string[]> = {};

    for (const match of round.matches) {
      const p1 = match.team1.player1.id;
      const p2 = match.team1.player2.id;
      const p3 = match.team2.player1.id;
      const p4 = match.team2.player2.id;

      partnerMap[p1] = p2;
      partnerMap[p2] = p1;
      partnerMap[p3] = p4;
      partnerMap[p4] = p3;

      opponentsMap[p1] = [p3, p4];
      opponentsMap[p2] = [p3, p4];
      opponentsMap[p3] = [p1, p2];
      opponentsMap[p4] = [p1, p2];
    }

    if (round.singlesMatch) {
      if (round.singlesMatch.isTrainerChallenge && round.singlesMatch.player3) {
        const trainerId = round.singlesMatch.player1.id;
        const b1Id = round.singlesMatch.player2.id;
        const b2Id = round.singlesMatch.player3.id;

        // b1 und b2 sind Partner im Doppel gegen den Trainer
        partnerMap[b1Id] = b2Id;
        partnerMap[b2Id] = b1Id;

        opponentsMap[trainerId] = [b1Id, b2Id];
        opponentsMap[b1Id] = [trainerId];
        opponentsMap[b2Id] = [trainerId];
      } else {
        const s1 = round.singlesMatch.player1.id;
        const s2 = round.singlesMatch.player2.id;
        opponentsMap[s1] = [s2];
        opponentsMap[s2] = [s1];
      }
    }

    pairings.push({
      date: plan.date,
      roundNumber: round.roundNumber,
      partnerMap,
      opponentsMap
    });
  }

  return pairings;
}
