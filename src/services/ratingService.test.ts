import { describe, it, expect } from 'vitest';
import {
  calculateScoreDifference,
  formatScore,
  evaluateMatchScore,
  accumulateSessionEvidence,
  generateSkillProposals,
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
    it('erfordert mindestens 3 Spiele und 2 verschiedene Partner vor einem Vorschlag', () => {
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
      let proposals = generateSkillProposals(players);
      expect(proposals).toHaveLength(0); // Erst 1 Spiel -> kein Vorschlag

      // Match 2: Jan wieder mit Partner 1 gewinnt klar (S = 2)
      const m2 = createDummyMatch('peer', jan, otherPlayers[0], otherPlayers[2], otherPlayers[3], {
        set1Team1: 21,
        set1Team2: 9,
        set2Team1: 21,
        set2Team2: 10
      });
      players = accumulateSessionEvidence(players, { ...r1, matches: [m2] }, '2026-10-08');
      proposals = generateSkillProposals(players);
      expect(proposals).toHaveLength(0); // Erst 2 Spiele -> kein Vorschlag

      // Match 3: Jan nochmals mit demselben Partner 1
      const m3 = createDummyMatch('peer', jan, otherPlayers[0], otherPlayers[2], otherPlayers[3], {
        set1Team1: 21,
        set1Team2: 9,
        set2Team1: 21,
        set2Team2: 10
      });
      players = accumulateSessionEvidence(players, { ...r1, matches: [m3] }, '2026-10-15');
      proposals = generateSkillProposals(players);
      // Obwohl 3 Spiele: nur 1 Partner! Vorschlag darf noch NICHT ausgelöst werden
      expect(proposals).toHaveLength(0);

      // Match 4: Jan spielt nun mit Partner 2 und gewinnt ebenfalls überlegen (S = 2)
      const m4 = createDummyMatch('peer', jan, otherPlayers[1], otherPlayers[2], otherPlayers[3], {
        set1Team1: 21,
        set1Team2: 10,
        set2Team1: 21,
        set2Team2: 10
      });
      players = accumulateSessionEvidence(players, { ...r1, matches: [m4] }, '2026-10-22');
      proposals = generateSkillProposals(players);

      // Jetzt sind es 4 Spiele mit 2 verschiedenen Partnern und starkem positiven Signal
      expect(proposals.length).toBeGreaterThan(0);
      const janProposal = proposals.find(p => p.player.id === 'p1');
      expect(janProposal).toBeDefined();
      expect(janProposal?.proposedDelta).toBe(0.3);
      expect(janProposal?.currentSkill).toBe(4);
      expect(janProposal?.targetAdjustment).toBe(0.3);
      expect(janProposal?.newEffectiveSkill).toBe(4.3);
    });

    it('achtet auf Grenzwerte (max +/- 1.5 Adjustment und 1 bis 10 Limit)', () => {
      // Spieler steht schon bei +1.4 Adjustment
      const alex = createDummyPlayer('p_top', 'Alex', 9, 1.4);
      const records = [
        {
          date: '2026-10-01',
          partnerId: 'p2',
          opponentIds: ['p3', 'p4'] as [string, string],
          pointDiff: 25,
          calculatedDiff: 0,
          observedSignal: 2,
          expectedSignal: 0,
          surpriseSignal: 2
        },
        {
          date: '2026-10-08',
          partnerId: 'p3',
          opponentIds: ['p2', 'p4'] as [string, string],
          pointDiff: 25,
          calculatedDiff: 0,
          observedSignal: 2,
          expectedSignal: 0,
          surpriseSignal: 2
        },
        {
          date: '2026-10-15',
          partnerId: 'p4',
          opponentIds: ['p2', 'p3'] as [string, string],
          pointDiff: 25,
          calculatedDiff: 0,
          observedSignal: 2,
          expectedSignal: 0,
          surpriseSignal: 2
        }
      ];
      alex.evidence = { records };

      const proposals = generateSkillProposals([alex]);
      expect(proposals).toHaveLength(1);
      // Darf max +1.5 erreichen (also 1.4 + 0.3 = 1.7 wird auf 1.5 gekappt, bzw. 9 + 1.0 gekappt)
      expect(proposals[0].targetAdjustment).toBe(1.0); // weil skill 9 + 1.0 = 10.0 (Maximalwert!)
      expect(proposals[0].newEffectiveSkill).toBe(10.0);
    });

    it('übernimmt, verwirft und setzt Stärkeanpassungen zurück', () => {
      let player = createDummyPlayer('p1', 'Jan', 4, 0);
      player.evidence = {
        records: [
          {
            date: 'd1',
            partnerId: 'p2',
            opponentIds: ['p3', 'p4'],
            pointDiff: 25,
            calculatedDiff: 0,
            observedSignal: 2,
            expectedSignal: 0,
            surpriseSignal: 2
          }
        ]
      };

      // 1. Übernehmen
      player = applySkillAdjustment(player, 0.3);
      expect(player.skillAdjustment).toBe(0.3);
      expect(player.evidence.records).toHaveLength(0); // Evidenz zurückgesetzt

      // 2. Verwerfen
      player.evidence = {
        records: [
          {
            date: 'd2',
            partnerId: 'p3',
            opponentIds: ['p1', 'p4'],
            pointDiff: -25,
            calculatedDiff: 0,
            observedSignal: -2,
            expectedSignal: 0,
            surpriseSignal: -2
          }
        ]
      };
      player = dismissSkillProposal(player);
      expect(player.skillAdjustment).toBe(0.3); // Bleibt unverändert
      expect(player.evidence.records).toHaveLength(0); // Evidenz geleert

      // 3. Zurücksetzen auf Trainer-Basiswert
      player = resetPlayerSkillToBaseline(player);
      expect(player.skillAdjustment).toBe(0);
      expect(player.skill).toBe(4);
      expect(player.evidence.records).toHaveLength(0);
    });
  });
});
