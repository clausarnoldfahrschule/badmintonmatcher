import { describe, it, expect } from 'vitest';
import { generateRoundPlan, generateFullSession, TRAINER_ID } from './pairingEngine';
import { Player } from '../types';

describe('Pairing Engine (Paarungs-Algorithmus)', () => {
  // Test-Spielerliste mit unterschiedlichen Stärken (1 bis 10)
  const mockPlayers: Player[] = [
    { id: 'p1', name: 'Alex (Top)', skill: 9, isActive: true, createdAt: 1 },
    { id: 'p2', name: 'Ben (Top)', skill: 8, isActive: true, createdAt: 2 },
    { id: 'p3', name: 'Chris (Stark)', skill: 8, isActive: true, createdAt: 3 },
    { id: 'p4', name: 'Daniel (Stark)', skill: 7, isActive: true, createdAt: 4 },
    { id: 'p5', name: 'Emma (Mittel)', skill: 5, isActive: true, createdAt: 5 },
    { id: 'p6', name: 'Felix (Mittel)', skill: 5, isActive: true, createdAt: 6 },
    { id: 'p7', name: 'Greta (Anfänger)', skill: 3, isActive: true, createdAt: 7 },
    { id: 'p8', name: 'Hanna (Anfänger)', skill: 2, isActive: true, createdAt: 8 }
  ];

  // Standard-Anwesenheit für alle 8 Spieler
  const defaultAttendance = mockPlayers.reduce((acc, p) => {
    acc[p.id] = { round1: true, round2: true, round3: true };
    return acc;
  }, {} as Record<string, { round1: boolean; round2: boolean; round3: boolean }>);

  it('Modus Peer (Homogen): Verteilt Starke auf Feld 1 und Schwächere auf Feld 2', () => {
    const plan = generateRoundPlan({
      roundNumber: 1,
      roundType: 'peer',
      players: mockPlayers,
      attendanceMap: defaultAttendance,
      trainerAvailable: false
    });

    expect(plan.matches).toHaveLength(2); // 8 Spieler = 2 Felder
    expect(plan.restingPlayers).toHaveLength(0);

    // Feld 1 sollte die Top 4 Spieler enthalten (Skills 9, 8, 8, 7)
    const court1Players = [
      plan.matches[0].team1.player1.id,
      plan.matches[0].team1.player2.id,
      plan.matches[0].team2.player1.id,
      plan.matches[0].team2.player2.id
    ];
    expect(court1Players).toEqual(expect.arrayContaining(['p1', 'p2', 'p3', 'p4']));

    // Feld 2 sollte die schwächeren 4 Spieler enthalten (Skills 5, 5, 3, 2)
    const court2Players = [
      plan.matches[1].team1.player1.id,
      plan.matches[1].team1.player2.id,
      plan.matches[1].team2.player1.id,
      plan.matches[1].team2.player2.id
    ];
    expect(court2Players).toEqual(expect.arrayContaining(['p5', 'p6', 'p7', 'p8']));
  });

  it('Modus Mentor (Lern-Modus): Bildet Paare aus Stark + Schwach', () => {
    const plan = generateRoundPlan({
      roundNumber: 2,
      roundType: 'mentor',
      players: mockPlayers,
      attendanceMap: defaultAttendance,
      trainerAvailable: false
    });

    expect(plan.matches).toHaveLength(2);

    // In jedem Team muss ein starker (Skill >= 7) und ein schwächerer (Skill <= 5) Spieler sein
    for (const match of plan.matches) {
      // Team 1 Check
      const t1Skills = [match.team1.player1.skill, match.team1.player2.skill];
      expect(Math.max(...t1Skills)).toBeGreaterThanOrEqual(7);
      expect(Math.min(...t1Skills)).toBeLessThanOrEqual(5);

      // Team 2 Check
      const t2Skills = [match.team2.player1.skill, match.team2.player2.skill];
      expect(Math.max(...t2Skills)).toBeGreaterThanOrEqual(7);
      expect(Math.min(...t2Skills)).toBeLessThanOrEqual(5);

      // Differenz zwischen beiden Teams sollte sehr klein sein (ausgeglichenes Spiel)
      expect(match.skillDiff).toBeLessThanOrEqual(3);
    }
  });

  it('Trainer-Joker: Springt bei 7 Spielern (ungerade) als 8. Spieler ein', () => {
    // Nur 7 Spieler anwesend
    const sevenPlayers = mockPlayers.slice(0, 7);
    const attendanceSeven = sevenPlayers.reduce((acc, p) => {
      acc[p.id] = { round1: true, round2: true, round3: true };
      return acc;
    }, {} as Record<string, { round1: boolean; round2: boolean; round3: boolean }>);

    const plan = generateRoundPlan({
      roundNumber: 1,
      roundType: 'peer',
      players: sevenPlayers,
      attendanceMap: attendanceSeven,
      trainerAvailable: true,
      trainerSkill: 7
    });

    expect(plan.trainerParticipated).toBe(true);
    expect(plan.matches).toHaveLength(2); // 8 Spieler inkl. Trainer = 2 Felder
    expect(plan.restingPlayers).toHaveLength(0);

    // Überprüfe, dass der Trainer auf dem Feld steht
    const allAssignedIds = plan.matches.flatMap(m => [
      m.team1.player1.id,
      m.team1.player2.id,
      m.team2.player1.id,
      m.team2.player2.id
    ]);
    expect(allAssignedIds).toContain(TRAINER_ID);
  });

  it('Rundenverfügbarkeit: Spieler wird nur in den angemeldeten Runden eingesetzt', () => {
    // Daniel meldet sich NUR für Runde 2 an (späteres Kommen)
    const customAttendance = { ...defaultAttendance };
    customAttendance['p4'] = { round1: false, round2: true, round3: false };

    // In Runde 1 darf Daniel nicht aufgestellt werden
    const r1 = generateRoundPlan({
      roundNumber: 1,
      roundType: 'peer',
      players: mockPlayers,
      attendanceMap: customAttendance,
      trainerAvailable: true // Bei 7 Spielern springt Trainer ein
    });
    const r1Ids = r1.matches.flatMap(m => [
      m.team1.player1.id, m.team1.player2.id, m.team2.player1.id, m.team2.player2.id
    ]);
    expect(r1Ids).not.toContain('p4');

    // In Runde 2 muss Daniel aufgestellt werden
    const r2 = generateRoundPlan({
      roundNumber: 2,
      roundType: 'peer',
      players: mockPlayers,
      attendanceMap: customAttendance,
      trainerAvailable: false
    });
    const r2Ids = r2.matches.flatMap(m => [
      m.team1.player1.id, m.team1.player2.id, m.team2.player1.id, m.team2.player2.id
    ]);
    expect(r2Ids).toContain('p4');
  });

  it('Erzeugt eine vollständige 3-Runden-Session (Niveau -> Mentor -> Social)', () => {
    const session = generateFullSession(mockPlayers, defaultAttendance, {
      trainerAvailable: false,
      trainerSkill: 7
    });

    expect(session.rounds).toHaveLength(3);
    expect(session.rounds[0].roundType).toBe('peer');
    expect(session.rounds[1].roundType).toBe('mentor');
    expect(session.rounds[2].roundType).toBe('social');
  });
});
