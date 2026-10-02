import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadPlayers,
  savePlayers,
  exportEncryptedBackup,
  importEncryptedBackup,
  DEFAULT_DEMO_PLAYERS
} from './storage';
import { Player } from '../types';

describe('Storage Service & Encrypted Transfer', () => {
  // Simuliere LocalStorage für Node.js Testumgebung
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    global.localStorage = {
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
    expect(players).toHaveLength(DEFAULT_DEMO_PLAYERS.length);
    expect(players[0].name).toBe('Alex M.');
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
});
