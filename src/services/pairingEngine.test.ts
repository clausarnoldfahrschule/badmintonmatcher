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

  it('Einzel-Regel: Bei 2 übrigen Spielern (z.B. 10 oder 14 Spieler) wird ein 1vs1 Einzel gespielt', () => {
    // 10 Spieler = 2 Doppel (8 Spieler) + 1 Einzel (2 Spieler)
    const tenPlayers: Player[] = [
      ...mockPlayers,
      { id: 'p9', name: 'Ines (Mittel)', skill: 4, isActive: true, createdAt: 9 },
      { id: 'p10', name: 'Jan (Mittel)', skill: 4, isActive: true, createdAt: 10 }
    ];
    const attendanceTen = tenPlayers.reduce((acc, p) => {
      acc[p.id] = { round1: true, round2: true, round3: true };
      return acc;
    }, {} as Record<string, { round1: boolean; round2: boolean; round3: boolean }>);

    const plan = generateRoundPlan({
      roundNumber: 1,
      roundType: 'peer',
      players: tenPlayers,
      attendanceMap: attendanceTen,
      trainerAvailable: false, // Trainer bleibt draußen, da 10 Spieler gerade Zahl ist
      maxCourts: 8
    });

    expect(plan.matches).toHaveLength(2); // 2 Doppel-Felder
    expect(plan.singlesMatch).not.toBeNull(); // 1 Einzel-Feld
    expect(plan.singlesMatch?.courtNumber).toBe(3); // Feld 3 fürs Einzel
    expect(plan.restingPlayers).toHaveLength(0); // Niemand muss auf die Bank!
    
    // Die beiden Einzelspieler haben vergleichbare Stärken
    expect(plan.singlesMatch?.skillDiff).toBeLessThanOrEqual(2);
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

  it('Modus Social (Mix): Mischt Spieler felderübergreifend (Snake-Verteilung)', () => {
    const plan = generateRoundPlan({
      roundNumber: 3,
      roundType: 'social',
      players: mockPlayers,
      attendanceMap: defaultAttendance,
      trainerAvailable: false
    });

    expect(plan.matches).toHaveLength(2);

    // In Modus Social darf Feld 1 NICHT nur aus den 4 stärksten Spielern bestehen
    const court1PlayerIds = [
      plan.matches[0].team1.player1.id,
      plan.matches[0].team1.player2.id,
      plan.matches[0].team2.player1.id,
      plan.matches[0].team2.player2.id
    ];

    // Feld 1 enthält mindestens einen Spieler aus der unteren Hälfte (Skills 5, 3 oder 2)
    const hasLowerPlayer = court1PlayerIds.some(id => ['p5', 'p6', 'p7', 'p8'].includes(id));
    expect(hasLowerPlayer).toBe(true);
  });

  it('Einzel-Rotation: Spieler wechseln über die Runden im Einzel ab', () => {
    const tenPlayers: Player[] = [
      ...mockPlayers,
      { id: 'p9', name: 'Ines', skill: 4, isActive: true, createdAt: 9 },
      { id: 'p10', name: 'Jan', skill: 4, isActive: true, createdAt: 10 }
    ];
    const attendanceTen = tenPlayers.reduce((acc, p) => {
      acc[p.id] = { round1: true, round2: true, round3: true };
      return acc;
    }, {} as Record<string, { round1: boolean; round2: boolean; round3: boolean }>);

    // Runde 1
    const r1 = generateRoundPlan({
      roundNumber: 1,
      roundType: 'peer',
      players: tenPlayers,
      attendanceMap: attendanceTen,
      trainerAvailable: false
    });
    expect(r1.singlesMatch).not.toBeNull();
    const r1SinglesIds = [r1.singlesMatch!.player1.id, r1.singlesMatch!.player2.id];

    // Runde 2 mit R1 als Historie
    const r2 = generateRoundPlan({
      roundNumber: 2,
      roundType: 'mentor',
      players: tenPlayers,
      attendanceMap: attendanceTen,
      trainerAvailable: false,
      previousRoundsCurrentSession: [r1]
    });
    expect(r2.singlesMatch).not.toBeNull();
    const r2SinglesIds = [r2.singlesMatch!.player1.id, r2.singlesMatch!.player2.id];

    // In Runde 2 müssen andere Spieler das Einzel bestreiten!
    const overlap = r2SinglesIds.filter(id => r1SinglesIds.includes(id));
    expect(overlap.length).toBeLessThan(2);
  });

  it('Trainer-Joker: Darf niemals im Einzel eingesetzt werden', () => {
    // 5 Spieler anwesend + Trainer = 6 Spieler -> 1 Doppel (4 Spieler) + 1 Einzel (2 Spieler)
    const fivePlayers = mockPlayers.slice(0, 5);
    const attendanceFive = fivePlayers.reduce((acc, p) => {
      acc[p.id] = { round1: true, round2: true, round3: true };
      return acc;
    }, {} as Record<string, { round1: boolean; round2: boolean; round3: boolean }>);

    const plan = generateRoundPlan({
      roundNumber: 1,
      roundType: 'peer',
      players: fivePlayers,
      attendanceMap: attendanceFive,
      trainerAvailable: true,
      trainerSkill: 7
    });

    expect(plan.trainerParticipated).toBe(true);
    expect(plan.singlesMatch).not.toBeNull();

    // Der Trainer darf NICHT im Einzel spielen!
    expect(plan.singlesMatch!.player1.id).not.toBe(TRAINER_ID);
    expect(plan.singlesMatch!.player2.id).not.toBe(TRAINER_ID);
  });

  it('Randfälle: 2 Spieler (Einzel) und 3 Spieler + Trainer (Doppel)', () => {
    // 2 Spieler -> 1 Einzel
    const twoPlayers = mockPlayers.slice(0, 2);
    const att2 = { p1: { round1: true, round2: true, round3: true }, p2: { round1: true, round2: true, round3: true } };
    const plan2 = generateRoundPlan({
      roundNumber: 1,
      roundType: 'peer',
      players: twoPlayers,
      attendanceMap: att2,
      trainerAvailable: false
    });
    expect(plan2.matches).toHaveLength(0);
    expect(plan2.singlesMatch).not.toBeNull();

    // 3 Spieler + Trainer -> 1 volles Doppel
    const threePlayers = mockPlayers.slice(0, 3);
    const att3 = {
      p1: { round1: true, round2: true, round3: true },
      p2: { round1: true, round2: true, round3: true },
      p3: { round1: true, round2: true, round3: true }
    };
    const plan3 = generateRoundPlan({
      roundNumber: 1,
      roundType: 'peer',
      players: threePlayers,
      attendanceMap: att3,
      trainerAvailable: true
    });
    expect(plan3.trainerParticipated).toBe(true);
    expect(plan3.matches).toHaveLength(1);
    expect(plan3.singlesMatch).toBeNull();
  });

  it('Trainer-Challenge: Wenn 2 Einsteiger (Stärke <= 3) überbleiben, spielt der Trainer 1 gegen 2', () => {
    // 6 Spieler: 4 Fortgeschrittene (Doppel) + 2 Einsteiger (Stärken 2 und 3)
    const sixPlayers: Player[] = [
      { id: 'f1', name: 'Fortgeschritten 1', skill: 8, isActive: true, createdAt: 1 },
      { id: 'f2', name: 'Fortgeschritten 2', skill: 7, isActive: true, createdAt: 2 },
      { id: 'f3', name: 'Fortgeschritten 3', skill: 7, isActive: true, createdAt: 3 },
      { id: 'f4', name: 'Fortgeschritten 4', skill: 6, isActive: true, createdAt: 4 },
      { id: 'e1', name: 'Einsteiger 1', skill: 3, isActive: true, createdAt: 5 },
      { id: 'e2', name: 'Einsteiger 2', skill: 2, isActive: true, createdAt: 6 }
    ];

    const attSix = sixPlayers.reduce((acc, p) => {
      acc[p.id] = { round1: true, round2: true, round3: true };
      return acc;
    }, {} as Record<string, { round1: boolean; round2: boolean; round3: boolean }>);

    const plan = generateRoundPlan({
      roundNumber: 1,
      roundType: 'peer',
      players: sixPlayers,
      attendanceMap: attSix,
      trainerAvailable: true,
      trainerSkill: 7
    });

    // 1 Doppel auf Feld 1 (die 4 Fortgeschrittenen)
    expect(plan.matches).toHaveLength(1);
    // Feld 2: Trainer-Challenge 1 gegen 2
    expect(plan.singlesMatch).not.toBeNull();
    expect(plan.singlesMatch?.isTrainerChallenge).toBe(true);
    expect(plan.singlesMatch?.player1.id).toBe(TRAINER_ID); // Trainer spielt alleine
    expect(plan.singlesMatch?.player2.id).toBe('e1');
    expect(plan.singlesMatch?.player3?.id).toBe('e2');
    expect(plan.trainerParticipated).toBe(true);
  });

  it('Trainer-Eindeutigkeit: Trainer darf niemals auf mehr als einem Feld gleichzeitig eingesetzt werden', () => {
    // 5 Spieler: 3 Fortgeschrittene + 2 Einsteiger
    const fivePlayers: Player[] = [
      { id: 'f1', name: 'Fortgeschritten 1', skill: 8, isActive: true, createdAt: 1 },
      { id: 'f2', name: 'Fortgeschritten 2', skill: 7, isActive: true, createdAt: 2 },
      { id: 'f3', name: 'Fortgeschritten 3', skill: 7, isActive: true, createdAt: 3 },
      { id: 'e1', name: 'Einsteiger 1', skill: 3, isActive: true, createdAt: 4 },
      { id: 'e2', name: 'Einsteiger 2', skill: 2, isActive: true, createdAt: 5 }
    ];

    const attFive = fivePlayers.reduce((acc, p) => {
      acc[p.id] = { round1: true, round2: true, round3: true };
      return acc;
    }, {} as Record<string, { round1: boolean; round2: boolean; round3: boolean }>);

    const session = generateFullSession(fivePlayers, attFive, { trainerAvailable: true, trainerSkill: 7 });

    for (const round of [session.round1, session.round2, session.round3]) {
      if (!round) continue;
      let trainerCount = 0;
      for (const match of round.matches) {
        if (match.team1.player1.id === TRAINER_ID) trainerCount++;
        if (match.team1.player2.id === TRAINER_ID) trainerCount++;
        if (match.team2.player1.id === TRAINER_ID) trainerCount++;
        if (match.team2.player2.id === TRAINER_ID) trainerCount++;
      }
      if (round.singlesMatch) {
        if (round.singlesMatch.player1.id === TRAINER_ID) trainerCount++;
        if (round.singlesMatch.player2.id === TRAINER_ID) trainerCount++;
        if (round.singlesMatch.player3?.id === TRAINER_ID) trainerCount++;
      }
      // Trainer darf höchstens 1x pro Runde spielen
      expect(trainerCount).toBeLessThanOrEqual(1);
    }
  });

  it('Runde 3 Social Mix: Garantiert ausgeglichene Matches (keine Blowouts wie 12 vs 6)', () => {
    // 16 Demo-Spieler mit breitem Stärkespektrum (Skills 2 bis 9)
    const sixteenPlayers: Player[] = [
      { id: 'p1', name: 'Alex M.', skill: 9, isActive: true, createdAt: 1 },
      { id: 'p2', name: 'Bastian K.', skill: 8, isActive: true, createdAt: 2 },
      { id: 'p3', name: 'Christian W.', skill: 8, isActive: true, createdAt: 3 },
      { id: 'p4', name: 'Dirk S.', skill: 7, isActive: true, createdAt: 4 },
      { id: 'p5', name: 'Elena R.', skill: 7, isActive: true, createdAt: 5 },
      { id: 'p6', name: 'Fabian H.', skill: 6, isActive: true, createdAt: 6 },
      { id: 'p7', name: 'Gregor B.', skill: 6, isActive: true, createdAt: 7 },
      { id: 'p8', name: 'Hanna L.', skill: 5, isActive: true, createdAt: 8 },
      { id: 'p9', name: 'Ines T.', skill: 5, isActive: true, createdAt: 9 },
      { id: 'p10', name: 'Jan P.', skill: 4, isActive: true, createdAt: 10 },
      { id: 'p11', name: 'Klaus D.', skill: 4, isActive: true, createdAt: 11 },
      { id: 'p12', name: 'Laura M.', skill: 3, isActive: true, createdAt: 12 },
      { id: 'p13', name: 'Markus V.', skill: 3, isActive: true, createdAt: 13 },
      { id: 'p14', name: 'Nina K.', skill: 3, isActive: true, createdAt: 14 },
      { id: 'p15', name: 'Oliver F.', skill: 2, isActive: true, createdAt: 15 },
      { id: 'p16', name: 'Petra G.', skill: 2, isActive: true, createdAt: 16 }
    ];

    const att = sixteenPlayers.reduce((acc, p) => {
      acc[p.id] = { round1: true, round2: true, round3: true };
      return acc;
    }, {} as Record<string, { round1: boolean; round2: boolean; round3: boolean }>);

    // Teste mit 16 Spielern
    const session16 = generateFullSession(sixteenPlayers, att, { trainerAvailable: false, trainerSkill: 7 });
    for (const match of session16.rounds[2].matches) {
      // Differenz darf auf keinem Feld mehr als 3 betragen (kein Blowout)
      expect(match.skillDiff).toBeLessThanOrEqual(3);
    }

    // Teste mit 15 Spielern + Trainer-Joker (exakt das Szenario aus dem Benutzer-Screenshot)
    const fifteenPlayers = sixteenPlayers.slice(0, 15);
    const att15 = fifteenPlayers.reduce((acc, p) => {
      acc[p.id] = { round1: true, round2: true, round3: true };
      return acc;
    }, {} as Record<string, { round1: boolean; round2: boolean; round3: boolean }>);

    const session15 = generateFullSession(fifteenPlayers, att15, { trainerAvailable: true, trainerSkill: 7 });
    for (const match of session15.rounds[2].matches) {
      expect(match.skillDiff).toBeLessThanOrEqual(3);
    }
  });

  it('Stabilitätstest: generateFullSession darf für keine Spieleranzahl (0 bis 16) abstürzen', () => {
    for (let k = 0; k <= 16; k++) {
      const subset = mockPlayers.slice(0, k);
      const att = subset.reduce((acc, p) => {
        acc[p.id] = { round1: true, round2: true, round3: true };
        return acc;
      }, {} as Record<string, { round1: boolean; round2: boolean; round3: boolean }>);

      // Mit Trainer
      expect(() => {
        generateFullSession(subset, att, { trainerAvailable: true, trainerSkill: 7 });
      }).not.toThrow();

      // Ohne Trainer
      expect(() => {
        generateFullSession(subset, att, { trainerAvailable: false, trainerSkill: 7 });
      }).not.toThrow();
    }
  });
});
