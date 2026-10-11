import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPlayers,
  savePlayers,
  exportEncryptedBackup,
  importEncryptedBackup,
  DEFAULT_DEMO_PLAYERS,
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  loadTournamentConfig,
  saveTournamentConfig,
  generateCompactQRPayload,
  parseAndImportCompactQRPayload,
  QR_TRANSFER_PREFIX
} from './storage';
import { Player } from '../types';

describe('Storage Service & Encrypted Transfer', () => {
  // Simuliere LocalStorage für Node.js Testumgebung
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    (globalThis as any).localStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
      length: 0,
      key: () => null
    };
  });

  it('sollte standardmäßig Demo-Spieler laden, wenn Speicher leer ist', () => {
    const players = loadPlayers();
    expect(players).toHaveLength(42);
    expect(players[0].name).toBe('Siggi');
  });

  it('sollte alten 16er-Demo-Kader automatisch auf die 42 Spieler migrieren', () => {
    // Simuliere alten LocalStorage mit 16 Demo-Spielern
    const old16 = [
      { id: 'p1', name: 'Alex M.', skill: 9, isActive: true, createdAt: 1 },
      ...Array(14).fill({ id: 'px', name: 'Demo', skill: 5, isActive: true, createdAt: 2 }),
      { id: 'p16', name: 'Petra G.', skill: 2, isActive: true, createdAt: 16 }
    ];
    savePlayers(old16 as any);
    const migrated = loadPlayers();
    expect(migrated).toHaveLength(42);
    expect(migrated[0].name).toBe('Siggi');
  });

  it('sollte modifizierte Spielerliste speichern und wieder laden', () => {
    const custom: Player[] = [
      { id: 'c1', name: 'Neuer Spieler', skill: 6, isActive: true, createdAt: 123 }
    ];
    savePlayers(custom);
    const loaded = loadPlayers();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('Neuer Spieler');
  });

  it('sollte vollständigen Datenbestand verschlüsselt exportieren und importieren', async () => {
    const custom: Player[] = [
      { id: 'c1', name: 'Test Meister', skill: 8, isActive: true, createdAt: 123 },
      { id: 'c2', name: 'Test Novize', skill: 3, isActive: true, createdAt: 124 }
    ];
    savePlayers(custom);

    const password = 'SuperSicheresGruppenPasswort#2026';
    const encryptedBackup = await exportEncryptedBackup(password);

    expect(typeof encryptedBackup).toBe('string');
    expect(encryptedBackup).not.toContain('Test Meister'); // Keine Klartext-Namen!

    // Speicher leeren (wie auf dem Handy der Vertretung)
    store = {};

    // Jetzt importieren mit Passwort
    const result = await importEncryptedBackup(encryptedBackup, password);
    expect(result.playersCount).toBe(2);

    const restoredPlayers = loadPlayers();
    expect(restoredPlayers).toHaveLength(2);
    expect(restoredPlayers[0].name).toBe('Test Meister');
  });

  it('sollte den Import bei falschem Passwort abbrechen', async () => {
    const encryptedBackup = await exportEncryptedBackup('RichtigesPasswort');

    await expect(
      importEncryptedBackup(encryptedBackup, 'FalschesPasswort')
    ).rejects.toThrow('Entschlüsselung fehlgeschlagen');
  });

  it('sollte aktive Sitzung speichern, laden und leeren können', () => {
    expect(loadActiveSession()).toBeNull();

    const mockState = {
      sessionPlan: null,
      attendance: { p1: { round1: true, round2: false, round3: true } },
      activeRoundTab: 2 as const,
      trainerAvailable: false
    };

    saveActiveSession(mockState);
    const loaded = loadActiveSession();
    expect(loaded).not.toBeNull();
    expect(loaded?.activeRoundTab).toBe(2);
    expect(loaded?.trainerAvailable).toBe(false);
    expect(loaded?.attendance['p1']?.round2).toBe(false);

    clearActiveSession();
    expect(loadActiveSession()).toBeNull();
  });

  it('sollte Turnier-Konfiguration speichern und laden', () => {
    const config = {
      isActive: true,
      type: 'doubles' as const,
      tournamentDate: '2099-12-31',
      title: 'Vereinsmeisterschaft',
      pairs: [{ id: 'pair-1', player1Id: 'p1', player2Id: 'p2' }],
      schleifchenPlayerIds: []
    };
    saveTournamentConfig(config);
    const loaded = loadTournamentConfig();
    expect(loaded.isActive).toBe(true);
    expect(loaded.title).toBe('Vereinsmeisterschaft');
    expect(loaded.pairs).toHaveLength(1);
    expect(loaded.pairs[0].player1Id).toBe('p1');
  });

  it('sollte Turniermodus automatisch deaktivieren, wenn das Datum in der Vergangenheit liegt', () => {
    const pastConfig = {
      isActive: true,
      type: 'doubles' as const,
      tournamentDate: '2020-01-01', // weit in der Vergangenheit
      title: 'Vergangenes Turnier',
      pairs: [{ id: 'pair-1', player1Id: 'p1', player2Id: 'p2' }],
      schleifchenPlayerIds: []
    };
    saveTournamentConfig(pastConfig);
    const loaded = loadTournamentConfig();
    expect(loaded.isActive).toBe(false);
  });

  it('sollte Turnier-Konfiguration im verschlüsselten Backup mitnehmen', async () => {
    const config = {
      isActive: true,
      type: 'schleifchen' as const,
      tournamentDate: '2099-06-01',
      title: 'Schleifchen Sommercup',
      pairs: [],
      schleifchenPlayerIds: ['p1', 'p2', 'p3']
    };
    saveTournamentConfig(config);

    const password = 'TurnierBackupPasswort!';
    const encrypted = await exportEncryptedBackup(password);

    store = {};
    expect(loadTournamentConfig().isActive).toBe(false);

    await importEncryptedBackup(encrypted, password);
    const loaded = loadTournamentConfig();
    expect(loaded.isActive).toBe(true);
    expect(loaded.type).toBe('schleifchen');
    expect(loaded.schleifchenPlayerIds).toEqual(['p1', 'p2', 'p3']);
  });

  describe('QR-Code Schnellübertragung', () => {
    it('sollte einen kompakten QR-Payload erzeugen und vollständig importieren', () => {
      // 1. Individuelle Spieler und Daten anlegen
      const customPlayers: Player[] = [
        { id: 'siggi', name: 'Siggi', skill: 7, skillAdjustment: 0.3, isActive: true, createdAt: 100 },
        { id: 'claus', name: 'Claus', skill: 9, isActive: true, createdAt: 101 },
        { id: 'gast1', name: 'Lukas Gast', skill: 5, isActive: true, isGuest: true, invitedByPlayerId: 'claus', createdAt: 102 }
      ];
      savePlayers(customPlayers);

      const tournament = {
        isActive: true,
        type: 'doubles' as const,
        tournamentDate: '2099-10-10',
        title: 'Kreis-Doppel 2099',
        pairs: [{ id: 'p1', player1Id: 'siggi', player2Id: 'claus' }],
        schleifchenPlayerIds: []
      };
      saveTournamentConfig(tournament);

      // 2. QR Payload generieren
      const qrPayload = generateCompactQRPayload();
      expect(qrPayload.startsWith(QR_TRANSFER_PREFIX)).toBe(true);
      expect(qrPayload.length).toBeLessThan(1500); // Garantiert extrem kompakt für QR-Codes!

      // 3. Speicher leeren (wie auf dem Handy der Urlaubsvertretung)
      store = {};
      expect(loadPlayers()).toHaveLength(42); // Default Demo

      // 4. Importieren aus QR-Payload
      const result = parseAndImportCompactQRPayload(qrPayload);
      expect(result.playersCount).toBe(3);
      expect(result.tournamentImported).toBe(true);

      const restoredPlayers = loadPlayers();
      expect(restoredPlayers).toHaveLength(3);
      expect(restoredPlayers[0].name).toBe('Siggi');
      expect(restoredPlayers[0].skillAdjustment).toBe(0.3);
      expect(restoredPlayers[2].isGuest).toBe(true);
      expect(restoredPlayers[2].invitedByPlayerId).toBe('claus');

      const restoredTournament = loadTournamentConfig();
      expect(restoredTournament.isActive).toBe(true);
      expect(restoredTournament.title).toBe('Kreis-Doppel 2099');
      expect(restoredTournament.pairs).toHaveLength(1);
    });

    it('sollte fremde oder ungültige QR-Codes ablehnen', () => {
      expect(() => {
        parseAndImportCompactQRPayload('https://example.com/restaurant-menu');
      }).toThrow('Ungültiger QR-Code');

      expect(() => {
        parseAndImportCompactQRPayload(`${QR_TRANSFER_PREFIX}definitiv-keine-gueltigen-daten`);
      }).toThrow();
    });
  });
});
