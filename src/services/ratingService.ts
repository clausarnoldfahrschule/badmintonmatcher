/**
 * Bewertungs- und Rating-Service für Badminton-Doppel
 * 
 * Implementiert das selektive, gedämpfte Evidenz-System:
 * 1. Nur homogene Runden (Runde 1 / Niveau-Gleichheit) werden gewertet.
 * 2. Runden mit Trainer-Joker, Einzel und unvollständige Ergebnisse werden ignoriert.
 * 3. Drei-Stufen-Signal (M = Punktedifferenz aus 2 Gewinnsätzen):
 *    - |M| < 10: Ausgeglichen (Signal o = 0)
 *    - 10 <= |M| <= 20: Mäßiges Übergewicht (Signal o = ±1)
 *    - |M| > 20: Starkes Übergewicht (Signal o = ±2)
 * 4. Erwartungswert e = clamp(d / 2, -2, 2) mit d = Team1-Stärke - Team2-Stärke.
 * 5. Überraschungssignal S = o - e:
 *    - Favoritensieg schwächt das Signal ab.
 *    - Underdog-Sieg verstärkt das Signal.
 * 6. Evidenz-Sammlung im Hintergrund über Wochen:
 *    - Mindestens 3 gewertete R1-Matches.
 *    - Mindestens 2 verschiedene Doppelpartner.
 * 7. Vorschlags-Prinzip: Keine automatischen Sprünge, Freigabe liegt beim Trainer (±0.3).
 *    Der Trainer-Basiswert bleibt als unveränderlicher Anker erhalten (max ±1.5 Adjustment).
 */

import { Player, Match, MatchScore, MatchEvidenceRecord, SkillProposal, RoundPlan } from '../types';
import { TRAINER_ID, getEffectiveSkill } from './pairingEngine';

export const MAX_SKILL_ADJUSTMENT = 1.5;
export const MIN_SKILL_ADJUSTMENT = -1.5;
export const DEFAULT_PROPOSAL_DELTA = 0.3;
export const MIN_QUALIFYING_MATCHES = 3;
export const MIN_UNIQUE_PARTNERS = 2;
export const SIGNAL_PROPOSAL_THRESHOLD = 0.8;

/**
 * Berechnet Summenpunkte und Punktedifferenz aus den zwei Sätzen eines Matches
 */
export function calculateScoreDifference(score: MatchScore): {
  team1Pts: number;
  team2Pts: number;
  diff: number; // Positiv = Team 1 vorne, Negativ = Team 2 vorne
} {
  const team1Pts = (Number(score.set1Team1) || 0) + (Number(score.set2Team1) || 0);
  const team2Pts = (Number(score.set1Team2) || 0) + (Number(score.set2Team2) || 0);
  return {
    team1Pts,
    team2Pts,
    diff: team1Pts - team2Pts
  };
}

/**
 * Formatiert das Ergebnis zweier Sätze lesbar (z. B. "21:18, 21:15")
 */
export function formatScore(score?: MatchScore): string {
  if (!score) return '';
  return `${score.set1Team1}:${score.set1Team2}, ${score.set2Team1}:${score.set2Team2}`;
}

/**
 * Überprüft, ob ein Satz-Ergebnis vollständig und plausibel eingetragen ist
 */
export function isScoreComplete(score?: MatchScore): boolean {
  if (!score) return false;
  const s1T1 = Number(score.set1Team1);
  const s1T2 = Number(score.set1Team2);
  const s2T1 = Number(score.set2Team1);
  const s2T2 = Number(score.set2Team2);

  // Mindestens ein Satz muss reguläre Punkte aufweisen (>= 15 Punkte)
  const validNumbers = !isNaN(s1T1) && !isNaN(s1T2) && !isNaN(s2T1) && !isNaN(s2T2);
  const played = (s1T1 > 0 || s1T2 > 0) && (s2T1 > 0 || s2T2 > 0);
  return validNumbers && played;
}

export interface MatchEvaluationResult {
  eligible: boolean;
  reason?: string;
  pointDiff?: number; // M
  calculatedDiff?: number; // d
  observedSignal?: number; // o
  expectedSignal?: number; // e
  surpriseSignal?: number; // S = o - e
}

/**
 * Bewertet ein Match anhand des 3-Stufen-Signalmodells mit Erwartungskorrektur
 */
export function evaluateMatchScore(match: Match): MatchEvaluationResult {
  // 1. Nur Runde 1 (Niveau-Gleichheit) ist zur Einstufung valide
  if (match.roundType !== 'peer') {
    return {
      eligible: false,
      reason: 'Nur homogene Runden (Runde 1) werden für Spielstärken ausgewertet.'
    };
  }

  // 2. Trainer-Joker Matches ausschließen
  const hasTrainer =
    match.team1.player1.id === TRAINER_ID ||
    match.team1.player2.id === TRAINER_ID ||
    match.team2.player1.id === TRAINER_ID ||
    match.team2.player2.id === TRAINER_ID;

  if (hasTrainer) {
    return {
      eligible: false,
      reason: 'Matches mit dem Trainer als Joker werden nicht gewertet.'
    };
  }

  // 3. Ergebnis vorhanden und vollständig?
  if (!match.score || !isScoreComplete(match.score)) {
    return {
      eligible: false,
      reason: 'Kein vollständiges Ergebnis eingetragen.'
    };
  }

  // 4. Punktedifferenz berechnen: M = Team1 Punkte - Team2 Punkte
  const { diff: pointDiff } = calculateScoreDifference(match.score);

  // 5. Beobachtetes Signal o:
  // |M| < 10 -> 0
  // 10 <= |M| <= 20 -> +/- 1
  // |M| > 20 -> +/- 2
  const absDiff = Math.abs(pointDiff);
  let observedSignal = 0;
  if (absDiff >= 10 && absDiff <= 20) {
    observedSignal = pointDiff > 0 ? 1 : -1;
  } else if (absDiff > 20) {
    observedSignal = pointDiff > 0 ? 2 : -2;
  }

  // 6. Rechnerische Stärkedifferenz d: Team1 - Team2 (unter Berücksichtigung von effectiveSkill)
  const team1Skill = getEffectiveSkill(match.team1.player1) + getEffectiveSkill(match.team1.player2);
  const team2Skill = getEffectiveSkill(match.team2.player1) + getEffectiveSkill(match.team2.player2);
  const calculatedDiff = Math.round((team1Skill - team2Skill) * 10) / 10;

  // 7. Erwartungswert e = clamp(d / 2, -2, 2)
  const rawExpected = calculatedDiff / 2;
  const expectedSignal = Math.max(-2, Math.min(2, Math.round(rawExpected * 10) / 10));

  // 8. Überraschungssignal S = o - e (aus Sicht von Team 1)
  const surpriseSignal = Math.round((observedSignal - expectedSignal) * 10) / 10;

  return {
    eligible: true,
    pointDiff,
    calculatedDiff,
    observedSignal,
    expectedSignal,
    surpriseSignal
  };
}

/**
 * Sammelt Evidenz-Daten aus Runde 1 eines Abends und fügt sie den Spielern hinzu
 */
export function accumulateSessionEvidence(
  players: Player[],
  roundPlanR1: RoundPlan,
  date: string
): Player[] {
  if (roundPlanR1.roundNumber !== 1 || roundPlanR1.roundType !== 'peer') {
    return players;
  }

  // Map aller Spieler für effizientes Nachschlagen
  const playerMap = new Map<string, Player>(players.map(p => [p.id, { ...p }]));

  for (const match of roundPlanR1.matches) {
    const evalResult = evaluateMatchScore(match);
    if (!evalResult.eligible || evalResult.surpriseSignal === undefined) {
      continue;
    }

    const { pointDiff, calculatedDiff, observedSignal, expectedSignal, surpriseSignal } = evalResult;

    // Team 1 Spieler
    const t1P1Id = match.team1.player1.id;
    const t1P2Id = match.team1.player2.id;
    const t2P1Id = match.team2.player1.id;
    const t2P2Id = match.team2.player2.id;

    const recordTeam1: MatchEvidenceRecord = {
      date,
      partnerId: '', // wird individuell gesetzt
      opponentIds: [t2P1Id, t2P2Id],
      pointDiff: pointDiff!,
      calculatedDiff: calculatedDiff!,
      observedSignal: observedSignal!,
      expectedSignal: expectedSignal!,
      surpriseSignal: surpriseSignal!
    };

    // Für Team 2 ist alles invertiert
    const recordTeam2: MatchEvidenceRecord = {
      date,
      partnerId: '',
      opponentIds: [t1P1Id, t1P2Id],
      pointDiff: -pointDiff!,
      calculatedDiff: -calculatedDiff!,
      observedSignal: -observedSignal!,
      expectedSignal: -expectedSignal!,
      surpriseSignal: -surpriseSignal!
    };

    // Eintrag für t1P1
    if (playerMap.has(t1P1Id)) {
      const p = playerMap.get(t1P1Id)!;
      const records = [...(p.evidence?.records || []), { ...recordTeam1, partnerId: t1P2Id }];
      playerMap.set(t1P1Id, { ...p, evidence: { records } });
    }

    // Eintrag für t1P2
    if (playerMap.has(t1P2Id)) {
      const p = playerMap.get(t1P2Id)!;
      const records = [...(p.evidence?.records || []), { ...recordTeam1, partnerId: t1P1Id }];
      playerMap.set(t1P2Id, { ...p, evidence: { records } });
    }

    // Eintrag für t2P1
    if (playerMap.has(t2P1Id)) {
      const p = playerMap.get(t2P1Id)!;
      const records = [...(p.evidence?.records || []), { ...recordTeam2, partnerId: t2P2Id }];
      playerMap.set(t2P1Id, { ...p, evidence: { records } });
    }

    // Eintrag für t2P2
    if (playerMap.has(t2P2Id)) {
      const p = playerMap.get(t2P2Id)!;
      const records = [...(p.evidence?.records || []), { ...recordTeam2, partnerId: t2P1Id }];
      playerMap.set(t2P2Id, { ...p, evidence: { records } });
    }
  }

  return Array.from(playerMap.values());
}

/**
 * Erstellt Vorschläge zur Feinjustierung der Spielstärke, falls genügend Evidenz vorliegt:
 * - Mindestens 3 gewertete R1-Spiele
 * - Mindestens 2 verschiedene Partner
 * - Durchschnittliches Überraschungssignal |S_avg| >= 0.8
 */
export function generateSkillProposals(players: Player[]): SkillProposal[] {
  const proposals: SkillProposal[] = [];

  for (const player of players) {
    if (player.id === TRAINER_ID) continue;

    const records = player.evidence?.records || [];
    if (records.length < MIN_QUALIFYING_MATCHES) continue;

    // Partner-Diversität prüfen
    const uniquePartners = new Set(records.map(r => r.partnerId));
    if (uniquePartners.size < MIN_UNIQUE_PARTNERS) continue;

    const totalSignal = records.reduce((sum, r) => sum + r.surpriseSignal, 0);
    const avgSignal = totalSignal / records.length;

    let proposedDelta = 0;
    if (avgSignal >= SIGNAL_PROPOSAL_THRESHOLD) {
      proposedDelta = DEFAULT_PROPOSAL_DELTA;
    } else if (avgSignal <= -SIGNAL_PROPOSAL_THRESHOLD) {
      proposedDelta = -DEFAULT_PROPOSAL_DELTA;
    }

    if (proposedDelta === 0) continue;

    const currentAdjustment = player.skillAdjustment || 0;
    let targetAdjustment = Math.round((currentAdjustment + proposedDelta) * 10) / 10;

    // Grenzen von +/- 1.5 bezogen auf den Basis-Skill respektieren
    targetAdjustment = Math.max(MIN_SKILL_ADJUSTMENT, Math.min(MAX_SKILL_ADJUSTMENT, targetAdjustment));

    // Effektive Grenzen 1 bis 10 respektieren
    const potentialEff = player.skill + targetAdjustment;
    if (potentialEff > 10) {
      targetAdjustment = Math.round((10 - player.skill) * 10) / 10;
    } else if (potentialEff < 1) {
      targetAdjustment = Math.round((1 - player.skill) * 10) / 10;
    }

    // Falls keine Änderung mehr möglich ist (z. B. bereits am Limit)
    if (Math.abs(targetAdjustment - currentAdjustment) < 0.05) continue;

    const newEffectiveSkill = Math.round((player.skill + targetAdjustment) * 10) / 10;

    const reason =
      proposedDelta > 0
        ? `Übertrifft Erwartung deutlich (${records.length} Spiele mit ${uniquePartners.size} Partnern, Ø Signal +${avgSignal.toFixed(2)})`
        : `Bleibt unter Erwartung (${records.length} Spiele mit ${uniquePartners.size} Partnern, Ø Signal ${avgSignal.toFixed(2)})`;

    proposals.push({
      player,
      currentSkill: player.skill,
      currentAdjustment,
      proposedDelta,
      targetAdjustment,
      newEffectiveSkill,
      qualifyingMatchCount: records.length,
      uniquePartnerCount: uniquePartners.size,
      reason
    });
  }

  return proposals;
}

/**
 * Wendet eine bestätigte Stärkeanpassung auf einen Spieler an und leert die gesammelte Evidenz
 */
export function applySkillAdjustment(player: Player, newAdjustment: number): Player {
  const clamped = Math.max(
    MIN_SKILL_ADJUSTMENT,
    Math.min(MAX_SKILL_ADJUSTMENT, Math.round(newAdjustment * 10) / 10)
  );

  return {
    ...player,
    skillAdjustment: clamped,
    evidence: { records: [] }
  };
}

/**
 * Verwirft einen Vorschlag (leert die Evidenz, damit der Trainer nicht erneut gefragt wird)
 */
export function dismissSkillProposal(player: Player): Player {
  return {
    ...player,
    evidence: { records: [] }
  };
}

/**
 * Setzt die Feineinstellung eines Spielers auf den reinen Trainer-Basiswert zurück
 */
export function resetPlayerSkillToBaseline(player: Player): Player {
  return {
    ...player,
    skillAdjustment: 0,
    evidence: { records: [] }
  };
}
