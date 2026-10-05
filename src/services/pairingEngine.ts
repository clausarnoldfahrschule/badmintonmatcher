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
 * Prüft, ob zwei Spieler eine Gast-Host-Beziehung haben (Gast und sein einladender Freund)
 */
export function isGuestHostRelation(pA: Player, pB: Player): boolean {
  if (pA.isGuest && pA.invitedByPlayerId && pA.invitedByPlayerId === pB.id) return true;
  if (pB.isGuest && pB.invitedByPlayerId && pB.invitedByPlayerId === pA.id) return true;
  return false;
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

  // Für Gast und seinen einladenden Freund gilt die Wiederholungs-Strafe nicht,
  // da der Gast primär mit oder gegen seinen Freund spielen möchte
  const isP1P2GuestHost = isGuestHostRelation(p1, p2);
  const isP3P4GuestHost = isGuestHostRelation(p3, p4);

  // 1. Prüfung in den bereits gespielten Runden des HEUTIGEN Abends
  for (const prevRound of previousRounds) {
    for (const match of prevRound.matches) {
      const matchPlayerIds = [
        match.team1.player1.id,
        match.team1.player2.id,
        match.team2.player1.id,
        match.team2.player2.id
      ];

      // Gleiche Partner heute? (Sehr hohe Strafe: 120 Punkte - entfällt für Gast & Freund)
      const t1TodaySame =
        !isP1P2GuestHost &&
        ((match.team1.player1.id === p1.id && match.team1.player2.id === p2.id) ||
        (match.team1.player1.id === p2.id && match.team1.player2.id === p1.id) ||
        (match.team2.player1.id === p1.id && match.team2.player2.id === p2.id) ||
        (match.team2.player1.id === p2.id && match.team2.player2.id === p1.id));

      const t2TodaySame =
        !isP3P4GuestHost &&
        ((match.team1.player1.id === p3.id && match.team1.player2.id === p4.id) ||
        (match.team1.player1.id === p4.id && match.team1.player2.id === p3.id) ||
        (match.team2.player1.id === p3.id && match.team2.player2.id === p4.id) ||
        (match.team2.player1.id === p4.id && match.team2.player2.id === p3.id));

      if (t1TodaySame) penalty += 120;
      if (t2TodaySame) penalty += 120;

      // Komplett gleiches 4er-Feld heute? (Zusatzstrafe: 40 Punkte)
      const overlapCount = [p1.id, p2.id, p3.id, p4.id].filter(id => matchPlayerIds.includes(id)).length;
      if (overlapCount >= 3) {
        // Nicht bestrafen, wenn die Überschneidung durch die erwünschte Gast-Host-Kombination entsteht
        const hasGuestHostPair =
          isP1P2GuestHost || isP3P4GuestHost ||
          isGuestHostRelation(p1, p3) || isGuestHostRelation(p1, p4) ||
          isGuestHostRelation(p2, p3) || isGuestHostRelation(p2, p4);
        if (!hasGuestHostPair) {
          penalty += 40;
        }
      }
    }
  }

  // 2. Prüfung in der Historie früherer Trainingsabende (Vorwochen)
  for (const history of historicalPairings) {
    // Partner-Prüfung Vorwochen (Strafe: 40 Punkte - entfällt für Gast & Freund)
    if (!isP1P2GuestHost && (history.partnerMap[p1.id] === p2.id || history.partnerMap[p2.id] === p1.id)) {
      penalty += 40;
    }
    if (!isP3P4GuestHost && (history.partnerMap[p3.id] === p4.id || history.partnerMap[p4.id] === p3.id)) {
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
 * Ermittelt die wirksame Spielstärke eines Spielers unter Berücksichtigung
 * von Trainer-Basiswert und sanfter Langzeit-Korrektur (skillAdjustment).
 * Liefert einen auf 1 Nachkommastelle gerundeten Wert zwischen 1 und 10.
 */
export function getEffectiveSkill(player: Player): number {
  const base = player.skill;
  const adj = player.skillAdjustment ?? 0;
  const eff = Math.max(1, Math.min(10, base + adj));
  return Math.round(eff * 10) / 10;
}

/**
 * Erzeugt ein Team aus zwei Spielern inklusive Stärke-Berechnung
 */
export function createTeam(p1: Player, p2: Player): Team {
  const total = Math.round((getEffectiveSkill(p1) + getEffectiveSkill(p2)) * 10) / 10;
  return {
    player1: p1,
    player2: p2,
    totalSkill: total,
    averageSkill: Math.round((total / 2) * 10) / 10
  };
}

/**
 * Berechnet eine stetige, streng monoton steigende Strafpunkte für Stärkedifferenzen (Blowout-Schutz).
 * - Im Bereich 0 bis 1.0: Sehr flach (0 bis 25 Punkte), Spiele sind praktisch ausgeglichen.
 * - Im Bereich 1.0 bis 2.0: Moderat (25 bis 60 Punkte), Spiele sind voll wettbewerbsfähig.
 * - Ab 2.0: Stark progressiv/quadratisch ansteigend, um Blowouts (z. B. Differenz 4+)
 *   zuverlässig zu verhindern – auch gegenüber Partnerwechsel-Wünschen.
 * - Funktioniert stetig und sprungfrei für Dezimalwerte (z. B. 2.4).
 */
export function calculateBalancePenalty(skillDiff: number): number {
  const diff = Math.max(0, skillDiff);
  if (diff <= 1.0) {
    return diff * 25;
  }
  if (diff <= 2.0) {
    return 25 + (diff - 1.0) * 35;
  }
  const excess = diff - 2.0;
  return 60 + excess * 50 + excess * excess * 60;
}

/**
 * Bestimmt die optimale 2vs2-Aufteilung aus 4 Spielern für ein Feld inklusive Kostenbewertung.
 * Berücksichtigt für Mentor-Runden das Prinzip: Jedes Team besteht aus 1 stark + 1 schwach.
 */
export function findBestCourtMatchWithCost(
  roundNumber: number,
  courtNumber: number,
  fourPlayers: [Player, Player, Player, Player],
  roundType: 'peer' | 'mentor' | 'social',
  historicalPairings: HistoricalPairing[],
  previousRounds: RoundPlan[]
): { match: Match; cost: number } {
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

    // Im Mentor-Modus MUSS jedes Team aus einem stärkeren und einem schwächeren Spieler bestehen
    if (roundType === 'mentor') {
      const sortedBySkill = [...fourPlayers].sort((a, b) => getEffectiveSkill(b) - getEffectiveSkill(a));
      const strongIds = new Set([sortedBySkill[0].id, sortedBySkill[1].id]);
      const t1HasStrong = strongIds.has(p1.id) || strongIds.has(p2.id);
      const t1HasWeak = !strongIds.has(p1.id) || !strongIds.has(p2.id);
      if (!t1HasStrong || !t1HasWeak) continue;
    }

    const team1 = createTeam(p1, p2);
    const team2 = createTeam(p3, p4);
    const skillDiff = Math.abs(team1.totalSkill - team2.totalSkill);

    // Strafpunkte aus der Historie (Wiederholungen vermeiden)
    const historyPenalty = calculateHistoryPenalty(p1, p2, p3, p4, historicalPairings, previousRounds);
    const balancePenalty = calculateBalancePenalty(skillDiff);

    // Bonus, wenn Gast und einladender Freund auf demselben Feld stehen
    let guestBonus = 0;
    if (isGuestHostRelation(p1, p2) || isGuestHostRelation(p3, p4)) {
      guestBonus -= 80; // Gemeinsam als Doppel-Partner
    } else if (
      isGuestHostRelation(p1, p3) || isGuestHostRelation(p1, p4) ||
      isGuestHostRelation(p2, p3) || isGuestHostRelation(p2, p4)
    ) {
      guestBonus -= 50; // Als direkte Duell-Gegner auf demselben Feld
    }

    let cost = 0;
    if (roundType === 'peer') {
      cost = balancePenalty * 1.5 + historyPenalty + guestBonus;
    } else {
      cost = balancePenalty + historyPenalty + guestBonus;
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

  return { match: bestMatch!, cost: lowestCost };
}

/**
 * Bestimmt die optimale 2vs2-Aufteilung aus 4 Spielern für ein Feld
 */
export function findBestCourtMatch(
  roundNumber: number,
  courtNumber: number,
  fourPlayers: [Player, Player, Player, Player],
  roundType: 'peer' | 'mentor' | 'social',
  historicalPairings: HistoricalPairing[],
  previousRounds: RoundPlan[]
): Match {
  return findBestCourtMatchWithCost(
    roundNumber,
    courtNumber,
    fourPlayers,
    roundType,
    historicalPairings,
    previousRounds
  ).match;
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
    const sorted = [...candidates].sort((a, b) => getEffectiveSkill(b) - getEffectiveSkill(a));
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
      const diff = Math.abs(getEffectiveSkill(selectionPool[i]) - getEffectiveSkill(selectionPool[j]));
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
 * und feldübergreifender Swap-Optimierung zur Vermeidung von Blowouts.
 */
function generateMentorMatches(
  roundNumber: number,
  players: Player[],
  courtCount: number,
  historicalPairings: HistoricalPairing[],
  previousRounds: RoundPlan[]
): Match[] {
  if (courtCount <= 1) {
    const four = players.slice(0, 4) as [Player, Player, Player, Player];
    return [
      findBestCourtMatch(roundNumber, 1, four, 'mentor', historicalPairings, previousRounds)
    ];
  }

  const sorted = [...players].sort((a, b) => getEffectiveSkill(b) - getEffectiveSkill(a));
  const total = courtCount * 4;
  const half = total / 2;
  const strong = sorted.slice(0, half); // 2 * courtCount Spieler
  const weak = sorted.slice(half, total); // 2 * courtCount Spieler

  // Start-Aufteilung: Jedes Feld bekommt 2 Strong und 2 Weak mit balancierten Stärkesummen
  const courts: [Player, Player, Player, Player][] = Array.from({ length: courtCount }, (_, c) => [
    strong[c],
    strong[2 * courtCount - 1 - c],
    weak[c],
    weak[2 * courtCount - 1 - c]
  ]);

  // 2-Opt Swap-Optimierung zwischen Feldern:
  // Strong tauscht mit Strong (Index 0,1), Weak tauscht mit Weak (Index 2,3)
  // Dies garantiert, dass die Mentor-Bedingung auf jedem Feld streng erhalten bleibt.
  let improved = true;
  let itCount = 0;
  while (improved && itCount < 30) {
    improved = false;
    itCount++;
    for (let c1 = 0; c1 < courtCount; c1++) {
      for (let c2 = c1 + 1; c2 < courtCount; c2++) {
        // Tausche Strong (Index 0 oder 1)
        for (let s1 = 0; s1 < 2; s1++) {
          for (let s2 = 0; s2 < 2; s2++) {
            const currentCost =
              findBestCourtMatchWithCost(roundNumber, c1 + 1, courts[c1], 'mentor', historicalPairings, previousRounds).cost +
              findBestCourtMatchWithCost(roundNumber, c2 + 1, courts[c2], 'mentor', historicalPairings, previousRounds).cost;

            const temp1 = courts[c1][s1];
            const temp2 = courts[c2][s2];
            courts[c1][s1] = temp2;
            courts[c2][s2] = temp1;

            const newCost =
              findBestCourtMatchWithCost(roundNumber, c1 + 1, courts[c1], 'mentor', historicalPairings, previousRounds).cost +
              findBestCourtMatchWithCost(roundNumber, c2 + 1, courts[c2], 'mentor', historicalPairings, previousRounds).cost;

            if (newCost < currentCost - 0.01) {
              improved = true;
            } else {
              courts[c1][s1] = temp1;
              courts[c2][s2] = temp2;
            }
          }
        }
        // Tausche Weak (Index 2 oder 3)
        for (let w1 = 2; w1 < 4; w1++) {
          for (let w2 = 2; w2 < 4; w2++) {
            const currentCost =
              findBestCourtMatchWithCost(roundNumber, c1 + 1, courts[c1], 'mentor', historicalPairings, previousRounds).cost +
              findBestCourtMatchWithCost(roundNumber, c2 + 1, courts[c2], 'mentor', historicalPairings, previousRounds).cost;

            const temp1 = courts[c1][w1];
            const temp2 = courts[c2][w2];
            courts[c1][w1] = temp2;
            courts[c2][w2] = temp1;

            const newCost =
              findBestCourtMatchWithCost(roundNumber, c1 + 1, courts[c1], 'mentor', historicalPairings, previousRounds).cost +
              findBestCourtMatchWithCost(roundNumber, c2 + 1, courts[c2], 'mentor', historicalPairings, previousRounds).cost;

            if (newCost < currentCost - 0.01) {
              improved = true;
            } else {
              courts[c1][w1] = temp1;
              courts[c2][w2] = temp2;
            }
          }
        }
      }
    }
  }

  const matches: Match[] = [];
  for (let c = 0; c < courtCount; c++) {
    const courtNumber = c + 1;
    matches.push(
      findBestCourtMatch(roundNumber, courtNumber, courts[c], 'mentor', historicalPairings, previousRounds)
    );
  }

  return matches;
}

/**
 * Erzeugt ausgewogene, abwechslungsreiche Social-Mix-Paarungen für Runde 3.
 * - Startet mit einer feldübergreifenden Schlangen-Verteilung (Snake).
 * - Führt eine 2-Opt Swap-Optimierung zwischen allen Feldern durch, um das globale
 *   Optimum aus maximaler Abwechslung (neue Partner/Gegner) und optimaler Spielbalance
 *   (keine Blowouts) zu finden.
 */
function generateSocialMatches(
  roundNumber: number,
  players: Player[],
  courtCount: number,
  historicalPairings: HistoricalPairing[],
  previousRounds: RoundPlan[]
): Match[] {
  if (courtCount <= 1) {
    const four = players.slice(0, 4) as [Player, Player, Player, Player];
    return [
      findBestCourtMatch(roundNumber, 1, four, 'social', historicalPairings, previousRounds)
    ];
  }

  const sorted = [...players].sort((a, b) => getEffectiveSkill(b) - getEffectiveSkill(a));
  // Start-Aufteilung: Snake über alle Felder
  const courts: [Player, Player, Player, Player][] = Array.from({ length: courtCount }, () => [] as any);
  let cIdx = 0;
  let dir = 1;
  for (const p of sorted) {
    courts[cIdx].push(p);
    cIdx += dir;
    if (cIdx >= courtCount) {
      cIdx = courtCount - 1;
      dir = -1;
    } else if (cIdx < 0) {
      cIdx = 0;
      dir = 1;
    }
  }

  // 2-Opt Swap-Optimierung zwischen allen Feldern
  let improved = true;
  let itCount = 0;
  while (improved && itCount < 30) {
    improved = false;
    itCount++;
    for (let c1 = 0; c1 < courtCount; c1++) {
      for (let c2 = c1 + 1; c2 < courtCount; c2++) {
        for (let p1 = 0; p1 < 4; p1++) {
          for (let p2 = 0; p2 < 4; p2++) {
            const currentCost =
              findBestCourtMatchWithCost(roundNumber, c1 + 1, courts[c1], 'social', historicalPairings, previousRounds).cost +
              findBestCourtMatchWithCost(roundNumber, c2 + 1, courts[c2], 'social', historicalPairings, previousRounds).cost;

            const temp1 = courts[c1][p1];
            const temp2 = courts[c2][p2];
            courts[c1][p1] = temp2;
            courts[c2][p2] = temp1;

            const newCost =
              findBestCourtMatchWithCost(roundNumber, c1 + 1, courts[c1], 'social', historicalPairings, previousRounds).cost +
              findBestCourtMatchWithCost(roundNumber, c2 + 1, courts[c2], 'social', historicalPairings, previousRounds).cost;

            if (newCost < currentCost - 0.01) {
              improved = true;
            } else {
              courts[c1][p1] = temp1;
              courts[c2][p2] = temp2;
            }
          }
        }
      }
    }
  }

  const matches: Match[] = [];
  for (let c = 0; c < courtCount; c++) {
    const courtNumber = c + 1;
    matches.push(
      findBestCourtMatch(roundNumber, courtNumber, courts[c], 'social', historicalPairings, previousRounds)
    );
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
    return att ? Boolean(att[roundKey]) : false;
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
      // Wenn der Trainer verfügbar ist UND noch nicht im Doppel eingesetzt wurde,
      // spielt er alleine gegen die zwei Anfänger (1 vs. 2 Trainer-Challenge)!
      const bothBeginners = getEffectiveSkill(s1) <= 3 && getEffectiveSkill(s2) <= 3;

      if (bothBeginners && trainerAvailable && !trainerParticipated) {
        const trainer = getTrainerPlayer(trainerSkill);
        trainerParticipated = true;
        singlesMatch = {
          id: `match-r${roundNumber}-c${singlesCourtNumber}-challenge-trainer-vs-${s1.id}-${s2.id}`,
          courtNumber: singlesCourtNumber,
          isTrainerChallenge: true,
          player1: trainer,
          player2: s1,
          player3: s2,
          skillDiff: Math.abs(trainer.skill - (getEffectiveSkill(s1) + getEffectiveSkill(s2)))
        };
      } else {
        singlesMatch = {
          id: `match-r${roundNumber}-c${singlesCourtNumber}-singles-${s1.id}-vs-${s2.id}`,
          courtNumber: singlesCourtNumber,
          isTrainerChallenge: false,
          player1: s1,
          player2: s2,
          skillDiff: Math.abs(getEffectiveSkill(s1) - getEffectiveSkill(s2))
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
      const sorted = [...poolForDoubles].sort((a, b) => getEffectiveSkill(b) - getEffectiveSkill(a));
      const courts: [Player, Player, Player, Player][] = [];

      for (let c = 0; c < maxPossibleDoublesCourts; c++) {
        courts.push(sorted.slice(c * 4, c * 4 + 4) as [Player, Player, Player, Player]);
      }

      // Option A: Wenn Gast und einladender Freund eine ähnliche Spielstärke haben (Differenz <= 2.0),
      // aber auf benachbarten Feldern gelandet sind, auf dasselbe Feld zusammenführen
      for (const guest of poolForDoubles) {
        if (!guest.isGuest || !guest.invitedByPlayerId) continue;
        const host = poolForDoubles.find(p => p.id === guest.invitedByPlayerId);
        if (!host) continue;

        const skillGap = Math.abs(getEffectiveSkill(guest) - getEffectiveSkill(host));
        if (skillGap > 2.0) continue; // Bei größerem Gefälle in R1 strikt nach Niveau trennen (Option A)

        const cGuestIdx = courts.findIndex(c => c.some(p => p.id === guest.id));
        const cHostIdx = courts.findIndex(c => c.some(p => p.id === host.id));

        if (cGuestIdx !== -1 && cHostIdx !== -1 && cGuestIdx !== cHostIdx) {
          const hostCourt = courts[cHostIdx];
          const guestCourt = courts[cGuestIdx];

          // Finde in Host-Court den Nicht-Host-Spieler mit geringster Stärkedistanz zu Gast
          let bestSwapTargetIdx = -1;
          let minDistance = Number.MAX_SAFE_INTEGER;

          for (let i = 0; i < hostCourt.length; i++) {
            if (hostCourt[i].id === host.id) continue;
            const dist = Math.abs(getEffectiveSkill(hostCourt[i]) - getEffectiveSkill(guest));
            if (dist < minDistance) {
              minDistance = dist;
              bestSwapTargetIdx = i;
            }
          }

          if (bestSwapTargetIdx !== -1 && minDistance <= 2.5) {
            const guestInCourtIdx = guestCourt.findIndex(p => p.id === guest.id);
            const temp = hostCourt[bestSwapTargetIdx];
            hostCourt[bestSwapTargetIdx] = guest;
            guestCourt[guestInCourtIdx] = temp;
          }
        }
      }

      for (let c = 0; c < maxPossibleDoublesCourts; c++) {
        const courtNumber = c + 1;
        const match = findBestCourtMatch(
          roundNumber,
          courtNumber,
          courts[c],
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
      // MODUS: SOZIALER MIX (Abwechslungsreich & Ausgeglichen)
      // -------------------------------------------------------------
      matches.push(
        ...generateSocialMatches(
          roundNumber,
          poolForDoubles,
          maxPossibleDoublesCourts,
          historicalPairings,
          previousRoundsCurrentSession
        )
      );
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

    const scoresMap: Record<string, import('../types').MatchScore> = {};
    for (const match of round.matches) {
      if (match.score) {
        scoresMap[match.id] = match.score;
      }
    }

    pairings.push({
      date: plan.date,
      roundNumber: round.roundNumber,
      partnerMap,
      opponentsMap,
      scoresMap: Object.keys(scoresMap).length > 0 ? scoresMap : undefined
    });
  }

  return pairings;
}
