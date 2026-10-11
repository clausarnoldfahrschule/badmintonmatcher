import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPlayers,
  savePlayers,
  exportEncryptedBackup,
  importEncryptedBackup,
  DEFAULT_DEMO_PLAYERS,
  loadActiveSession,
  saveActiveSession,
  clearActiveSession
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
});
