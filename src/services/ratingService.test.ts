import { describe, it, expect } from 'vitest';
import {
  calculateScoreDifference,
  formatScore,
  evaluateMatchScore,
  accumulateSessionEvidence,
  generateSkillProposals,
  applySkillProposal,
  applySkillAdjustment,
  dismissSkillProposal,
  resetPlayerSkillToBaseline
} from './ratingService';
import { Match, Player, RoundPlan } from '../types';
import { TRAINER_ID } from './pairingEngine';

function createDummyPlayer(id: string, name: string, skill: number, skillAdjustment?: number): Player {
  return {
    id,
    name,
    skill,
    skillAdjustment,
    isActive: true,
    createdAt: Date.now()
  };
}

function createDummyMatch(
  roundType: 'peer' | 'mentor' | 'social',
  t1p1: Player,
  t1p2: Player,
  t2p1: Player,
  t2p2: Player,
  score?: { set1Team1: number; set1Team2: number; set2Team1: number; set2Team2: number }
): Match {
  const t1Total = (t1p1.skill + (t1p1.skillAdjustment || 0)) + (t1p2.skill + (t1p2.skillAdjustment || 0));
  const t2Total = (t2p1.skill + (t2p1.skillAdjustment || 0)) + (t2p2.skill + (t2p2.skillAdjustment || 0));

  return {
    id: `m-${t1p1.id}-${t2p1.id}`,
    courtNumber: 1,
    roundType,
    team1: {
      player1: t1p1,
      player2: t1p2,
      totalSkill: t1Total,
      averageSkill: t1Total / 2
    },
    team2: {
      player1: t2p1,
      player2: t2p2,
      totalSkill: t2Total,
      averageSkill: t2Total / 2
    },
    skillDiff: Math.abs(t1Total - t2Total),
    score
  };
}

describe('Rating Service: Ergebniserfassung & Signalmodell', () => {
  it('berechnet Punkte-Differenzen und formatiert Scores korrekt', () => {
    const score = { set1Team1: 21, set1Team2: 18, set2Team1: 21, set2Team2: 15 };
    const diff = calculateScoreDifference(score);
    expect(diff.team1Pts).toBe(42);
    expect(diff.team2Pts).toBe(33);
    expect(diff.diff).toBe(9);
    expect(formatScore(score)).toBe('21:18, 21:15');
  });

  it('schließt Nicht-Peer-Runden (Mentor, Social) von der Einstufung aus', () => {
    const p1 = createDummyPlayer('p1', 'Alex', 8);
    const p2 = createDummyPlayer('p2', 'Jan', 4);
    const p3 = createDummyPlayer('p3', 'Basti', 8);
    const p4 = createDummyPlayer('p4', 'Klaus', 4);

    const match = createDummyMatch('mentor', p1, p2, p3, p4, {
      set1Team1: 21,
      set1Team2: 10,
      set2Team1: 21,
      set2Team2: 10
    });

    const res = evaluateMatchScore(match);
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('Nur homogene Runden');
  });

  it('schließt Spiele mit Trainer-Joker von der Wertung aus', () => {
    const p1 = createDummyPlayer('p1', 'Alex', 7);
    const trainer = { id: TRAINER_ID, name: 'Trainer', skill: 7, isActive: true, createdAt: 0 };
    const p3 = createDummyPlayer('p3', 'Basti', 7);
    const p4 = createDummyPlayer('p4', 'Dirk', 7);

    const match = createDummyMatch('peer', p1, trainer, p3, p4, {
      set1Team1: 21,
      set1Team2: 15,
      set2Team1: 21,
      set2Team2: 16
    });

    const res = evaluateMatchScore(match);
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('Trainer als Joker');
  });

  it('schließt Spiele mit Gastspielern vollständig von der Wertung aus', () => {
    const p1 = createDummyPlayer('p1', 'Alex', 7);
    const guest: Player = {
      id: 'guest-1',
      name: 'Lukas (Gast)',
      skill: 6,
      isActive: true,
      isGuest: true,
      invitedByPlayerId: 'p1',
      createdAt: Date.now()
    };
    const p3 = createDummyPlayer('p3', 'Basti', 7);
    const p4 = createDummyPlayer('p4', 'Dirk', 7);

    const match = createDummyMatch('peer', p1, guest, p3, p4, {
      set1Team1: 21,
      set1Team2: 10,
      set2Team1: 21,
      set2Team2: 10
    });

    const res = evaluateMatchScore(match);
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('Gastspielern');
  });

  it('ignoriert unvollständige oder fehlende Ergebnisse', () => {
    const p1 = createDummyPlayer('p1', 'Alex', 7);
    const p2 = createDummyPlayer('p2', 'Jan', 7);
    const p3 = createDummyPlayer('p3', 'Basti', 7);
    const p4 = createDummyPlayer('p4', 'Dirk', 7);

    const matchNoScore = createDummyMatch('peer', p1, p2, p3, p4);
    expect(evaluateMatchScore(matchNoScore).eligible).toBe(false);

    const matchZeroScore = createDummyMatch('peer', p1, p2, p3, p4, {
      set1Team1: 0,
      set1Team2: 0,
      set2Team1: 0,
      set2Team2: 0
    });
    expect(evaluateMatchScore(matchZeroScore).eligible).toBe(false);
  });

  describe('3-Stufen Signalmodell & Überraschung (Spezifikations-Validierung)', () => {
    const setupMatch = (t1Skills: [number, number], t2Skills: [number, number], mDiff: number) => {
      const p1 = createDummyPlayer('p1', 'P1', t1Skills[0]);
      const p2 = createDummyPlayer('p2', 'P2', t1Skills[1]);
      const p3 = createDummyPlayer('p3', 'P3', t2Skills[0]);
      const p4 = createDummyPlayer('p4', 'P4', t2Skills[1]);

      // Erzeuge Sätze, die exakt mDiff ergeben
      // z.B. bei mDiff = +4: 21:19 (+2) und 21:19 (+2) = +4
      // bei mDiff = +25: 21:8 (+13) und 21:9 (+12) = +25
      const half = Math.floor(mDiff / 2);
      const rem = mDiff - half;
      const score = {
        set1Team1: 21,
        set1Team2: 21 - half,
        set2Team1: 21,
        set2Team2: 21 - rem
      };
      return createDummyMatch('peer', p1, p2, p3, p4, score);
    };

    it('Fall 1: d = 0, M = +4 (ausgeglichen) -> o = 0, e = 0, S = 0', () => {
      const match = setupMatch([7, 7], [7, 7], 4);
      const res = evaluateMatchScore(match);
      expect(res.eligible).toBe(true);
      expect(res.calculatedDiff).toBe(0);
      expect(res.observedSignal).toBe(0);
      expect(res.expectedSignal).toBe(0);
      expect(res.surpriseSignal).toBe(0);
    });

    it('Fall 2: d = 0, M = +25 (klarer Sieg bei Gleichstand) -> o = 2, e = 0, S = 2', () => {
      const match = setupMatch([7, 7], [7, 7], 25);
      const res = evaluateMatchScore(match);
      expect(res.eligible).toBe(true);
      expect(res.calculatedDiff).toBe(0);
      expect(res.observedSignal).toBe(2);
      expect(res.expectedSignal).toBe(0);
      expect(res.surpriseSignal).toBe(2);
    });

    it('Fall 3: d = +2, M = +16 (Favorit gewinnt wie erwartet) -> o = 1, e = 1, S = 0', () => {
      const match = setupMatch([8, 8], [7, 7], 16);
      const res = evaluateMatchScore(match);
      expect(res.eligible).toBe(true);
      expect(res.calculatedDiff).toBe(2);
      expect(res.observedSignal).toBe(1);
      expect(res.expectedSignal).toBe(1);
      expect(res.surpriseSignal).toBe(0);
    });

    it('Fall 4: d = +2, M = +30 (Favorit gewinnt zu deutlich) -> o = 2, e = 1, S = 1', () => {
      const match = setupMatch([8, 8], [7, 7], 30);
      const res = evaluateMatchScore(match);
      expect(res.eligible).toBe(true);
      expect(res.calculatedDiff).toBe(2);
      expect(res.observedSignal).toBe(2);
      expect(res.expectedSignal).toBe(1);
      expect(res.surpriseSignal).toBe(1);
    });

    it('Fall 5: d = +2, M = -16 (Favorit verliert knapp) -> o = -1, e = 1, S = -2', () => {
      const match = setupMatch([8, 8], [7, 7], -16);
      const res = evaluateMatchScore(match);
      expect(res.eligible).toBe(true);
      expect(res.calculatedDiff).toBe(2);
      expect(res.observedSignal).toBe(-1);
      expect(res.expectedSignal).toBe(1);
      expect(res.surpriseSignal).toBe(-2);
    });

    it('Fall 6: d = +2, M = -25 (Favorit verliert klar) -> o = -2, e = 1, S = -3', () => {
      const match = setupMatch([8, 8], [7, 7], -25);
      const res = evaluateMatchScore(match);
      expect(res.eligible).toBe(true);
      expect(res.calculatedDiff).toBe(2);
      expect(res.observedSignal).toBe(-2);
      expect(res.expectedSignal).toBe(1);
      expect(res.surpriseSignal).toBe(-3);
    });

    it('Fall 7: d = +1, M = +25 -> o = 2, e = 0.5, S = 1.5 (abgeschwächt)', () => {
      const match = setupMatch([8, 7], [7, 7], 25);
      const res = evaluateMatchScore(match);
      expect(res.eligible).toBe(true);
      expect(res.calculatedDiff).toBe(1);
      expect(res.observedSignal).toBe(2);
      expect(res.expectedSignal).toBe(0.5);
      expect(res.surpriseSignal).toBe(1.5);
    });

    it('Fall 8: d = +1, M = -25 -> o = -2, e = 0.5, S = -2.5 (verstärkt)', () => {
      const match = setupMatch([8, 7], [7, 7], -25);
      const res = evaluateMatchScore(match);
      expect(res.eligible).toBe(true);
      expect(res.calculatedDiff).toBe(1);
      expect(res.observedSignal).toBe(-2);
      expect(res.expectedSignal).toBe(0.5);
      expect(res.surpriseSignal).toBe(-2.5);
    });
  });

  describe('Evidenz-Akkumulierung & Vorschlags-Generierung', () => {
    it('passt Zusatzwert lautlos im Hintergrund an (erfordert mindestens 3 Spiele und 2 verschiedene Partner)', () => {
      const jan = createDummyPlayer('p1', 'Jan', 4);
      const otherPlayers = [
        createDummyPlayer('p2', 'Partner 1', 4),
        createDummyPlayer('p3', 'Partner 2', 4),
        createDummyPlayer('p4', 'Gegner 1', 4),
        createDummyPlayer('p5', 'Gegner 2', 4)
      ];
      let players = [jan, ...otherPlayers];

      // Match 1: Jan mit Partner 1 gewinnt klar (S = 2)
      const m1 = createDummyMatch('peer', jan, otherPlayers[0], otherPlayers[2], otherPlayers[3], {
        set1Team1: 21,
        set1Team2: 8,
        set2Team1: 21,
        set2Team2: 9
      });
      const r1: RoundPlan = {
        roundNumber: 1,
        roundType: 'peer',
        matches: [m1],
        restingPlayers: [],
        trainerParticipated: false
      };

      players = accumulateSessionEvidence(players, r1, '2026-10-01');
      let janUpdated = players.find(p => p.id === 'p1')!;
      expect(janUpdated.skillAdjustment || 0).toBe(0); // Erst 1 Spiel -> noch kein Nudge
      expect(generateSkillProposals(players)).toHaveLength(0);

      // Match 2: Jan wieder mit Partner 1 gewinnt klar (S = 2)
      const m2 = createDummyMatch('peer', jan, otherPlayers[0], otherPlayers[2], otherPlayers[3], {
        set1Team1: 21,
        set1Team2: 9,
        set2Team1: 21,
        set2Team2: 10
      });
      players = accumulateSessionEvidence(players, { ...r1, matches: [m2] }, '2026-10-08');
      janUpdated = players.find(p => p.id === 'p1')!;
      expect(janUpdated.skillAdjustment || 0).toBe(0); // Erst 2 Spiele -> noch kein Nudge

      // Match 3: Jan nochmals mit demselben Partner 1
      const m3 = createDummyMatch('peer', jan, otherPlayers[0], otherPlayers[2], otherPlayers[3], {
        set1Team1: 21,
        set1Team2: 9,
        set2Team1: 21,
        set2Team2: 10
      });
      players = accumulateSessionEvidence(players, { ...r1, matches: [m3] }, '2026-10-15');
      janUpdated = players.find(p => p.id === 'p1')!;
      // Obwohl 3 Spiele: nur 1 Partner! Noch kein Nudge
      expect(janUpdated.skillAdjustment || 0).toBe(0);

      // Match 4: Jan spielt nun mit Partner 2 und gewinnt ebenfalls überlegen (S = 2)
      const m4 = createDummyMatch('peer', jan, otherPlayers[1], otherPlayers[2], otherPlayers[3], {
        set1Team1: 21,
        set1Team2: 10,
        set2Team1: 21,
        set2Team2: 10
      });
      players = accumulateSessionEvidence(players, { ...r1, matches: [m4] }, '2026-10-22');
      janUpdated = players.find(p => p.id === 'p1')!;

      // Jetzt sind es 4 Spiele mit 2 verschiedenen Partnern und starkem positiven Signal
      // -> Lautloser Nudge im Hintergrund auf +0.3!
      expect(janUpdated.skillAdjustment).toBe(0.3);
      expect(janUpdated.skill).toBe(4); // Basiswert bleibt unverändert!
      expect(janUpdated.evidence?.records).toHaveLength(0); // Evidenz für diesen Schritt geleert

      // Siggi wird NICHT mit Zwischenfragen gestört (da +0.3 < 0.8 Schwelle)
      expect(generateSkillProposals(players)).toHaveLength(0);
    });

    it('erzeugt erst ab Schwellenwert +/- 0.8 einen Aufstiegs- oder Abstiegsvorschlag für den Trainer', () => {
      // Spieler 1: steht bei +0.7 -> noch kein Vorschlag
      const p1 = createDummyPlayer('p1', 'Alex', 6, 0.7);
      expect(generateSkillProposals([p1])).toHaveLength(0);

      // Spieler 2: steht bei +0.8 -> Aufstiegsvorschlag zu Stufe 7!
      const p2 = createDummyPlayer('p2', 'Max', 6, 0.8);
      const promoProps = generateSkillProposals([p2]);
      expect(promoProps).toHaveLength(1);
      expect(promoProps[0].type).toBe('promotion');
      expect(promoProps[0].currentSkill).toBe(6);
      expect(promoProps[0].targetSkill).toBe(7);
      expect(promoProps[0].currentAdjustment).toBe(0.8);

      // Spieler 3: steht bei -0.8 -> Abstiegsvorschlag zu Stufe 4!
      const p3 = createDummyPlayer('p3', 'Peter', 5, -0.8);
      const relegateProps = generateSkillProposals([p3]);
      expect(relegateProps).toHaveLength(1);
      expect(relegateProps[0].type).toBe('relegation');
      expect(relegateProps[0].currentSkill).toBe(5);
      expect(relegateProps[0].targetSkill).toBe(4);
      expect(relegateProps[0].currentAdjustment).toBe(-0.8);

      // Höchststufe 10 kann nicht mehr befördert werden
      const pTop = createDummyPlayer('p_top', 'Profi', 10, 1.2);
      expect(generateSkillProposals([pTop])).toHaveLength(0);

      // Mindeststufe 1 kann nicht mehr abgestiegen werden
      const pMin = createDummyPlayer('p_min', 'Anfänger', 1, -1.0);
      expect(generateSkillProposals([pMin])).toHaveLength(0);
    });

    it('übernimmt Aufstieg: setzt Basiswert + 1 und Zusatzwert sauber auf 0 zurück', () => {
      const player = createDummyPlayer('p1', 'Max', 6, 0.9);
      const proposals = generateSkillProposals([player]);
      expect(proposals).toHaveLength(1);

      const updated = applySkillProposal(player, proposals[0]);
      expect(updated.skill).toBe(7); // Basiswert um 1 erhöht
      expect(updated.skillAdjustment).toBe(0); // Zusatzwert sauber auf 0 zurückgesetzt!
      expect(updated.evidence?.records).toHaveLength(0);
    });

    it('übernimmt Abstieg: setzt Basiswert - 1 und Zusatzwert sauber auf 0 zurück', () => {
      const player = createDummyPlayer('p1', 'Peter', 5, -0.9);
      const proposals = generateSkillProposals([player]);
      expect(proposals).toHaveLength(1);

      const updated = applySkillProposal(player, proposals[0]);
      expect(updated.skill).toBe(4); // Basiswert um 1 gesenkt
      expect(updated.skillAdjustment).toBe(0); // Zusatzwert sauber auf 0 zurückgesetzt!
      expect(updated.evidence?.records).toHaveLength(0);
    });

    it('verwirft Vorschlag: belässt Basiswert und dämpft Zusatzwert unter den Schwellenwert', () => {
      const player = createDummyPlayer('p1', 'Max', 6, 0.9);
      const proposals = generateSkillProposals([player]);
      expect(proposals).toHaveLength(1);

      const updated = dismissSkillProposal(player);
      expect(updated.skill).toBe(6); // Basiswert bleibt
      expect(updated.skillAdjustment).toBe(0.4); // Gedämpft unter 0.8
      // Jetzt poppt der Vorschlag nicht sofort wieder auf!
      expect(generateSkillProposals([updated])).toHaveLength(0);
    });

    it('setzt Feineinstellung sauber auf Trainer-Basiswert zurück', () => {
      let player = createDummyPlayer('p1', 'Jan', 4, 0.6);
      player = resetPlayerSkillToBaseline(player);
      expect(player.skillAdjustment).toBe(0);
      expect(player.skill).toBe(4);
      expect(player.evidence?.records).toHaveLength(0);
    });
  });
});
