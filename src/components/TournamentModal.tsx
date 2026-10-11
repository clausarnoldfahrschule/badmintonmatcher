import React, { useState, useEffect } from 'react';
import { Player, TournamentConfig, TournamentType, TournamentPair } from '../types';
import { Trophy, X, Plus, Trash2, Calendar, CheckSquare, Square, Info } from 'lucide-react';

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  tournamentConfig: TournamentConfig;
  onSaveConfig: (config: TournamentConfig) => void;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  players,
  tournamentConfig,
  onSaveConfig
}) => {
  const [isActive, setIsActive] = useState<boolean>(tournamentConfig.isActive);
  const [type, setType] = useState<TournamentType>(tournamentConfig.type);
  const [title, setTitle] = useState<string>(tournamentConfig.title || '');
  const [tournamentDate, setTournamentDate] = useState<string>(tournamentConfig.tournamentDate || '');
  const [pairs, setPairs] = useState<TournamentPair[]>(tournamentConfig.pairs || []);
  const [schleifchenPlayerIds, setSchleifchenPlayerIds] = useState<string[]>(
    tournamentConfig.schleifchenPlayerIds || []
  );

  // Zustand für neue Paarung
  const [newPlayer1Id, setNewPlayer1Id] = useState<string>('');
  const [newPlayer2Id, setNewPlayer2Id] = useState<string>('');

  useEffect(() => {
    setIsActive(tournamentConfig.isActive);
    setType(tournamentConfig.type || 'doubles');
    setTitle(tournamentConfig.title || '');
    setTournamentDate(tournamentConfig.tournamentDate || '');
    setPairs(tournamentConfig.pairs || []);
    setSchleifchenPlayerIds(tournamentConfig.schleifchenPlayerIds || []);
  }, [tournamentConfig, isOpen]);

  if (!isOpen) return null;

  // Aktive Vereinsspieler sortiert nach Name
  const activePlayers = players
    .filter(p => p.isActive && !p.isGuest)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleAddPair = () => {
    if (!newPlayer1Id || !newPlayer2Id || newPlayer1Id === newPlayer2Id) return;

    // Prüfe, ob genau diese Kombination bereits existiert
    const alreadyExists = pairs.some(
      p =>
        (p.player1Id === newPlayer1Id && p.player2Id === newPlayer2Id) ||
        (p.player1Id === newPlayer2Id && p.player2Id === newPlayer1Id)
    );
    if (alreadyExists) return;

    const newPair: TournamentPair = {
      id: `pair-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      player1Id: newPlayer1Id,
      player2Id: newPlayer2Id
    };

    setPairs([...pairs, newPair]);
    setNewPlayer1Id('');
    setNewPlayer2Id('');
  };

  const handleDeletePair = (pairId: string) => {
    setPairs(pairs.filter(p => p.id !== pairId));
  };

  const handleToggleSchleifchenPlayer = (playerId: string) => {
    if (schleifchenPlayerIds.includes(playerId)) {
      setSchleifchenPlayerIds(schleifchenPlayerIds.filter(id => id !== playerId));
    } else {
      setSchleifchenPlayerIds([...schleifchenPlayerIds, playerId]);
    }
  };

  const handleSelectAllSchleifchen = () => {
    setSchleifchenPlayerIds(activePlayers.map(p => p.id));
  };

  const handleClearSchleifchen = () => {
    setSchleifchenPlayerIds([]);
  };

  const handleSave = () => {
    onSaveConfig({
      isActive,
      type,
      title: title.trim(),
      tournamentDate,
      pairs,
      schleifchenPlayerIds
    });
    onClose();
  };

  const getPlayerName = (id: string): string => {
    const p = players.find(x => x.id === id);
    return p ? p.name : 'Unbekannt';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl shadow-xs">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Turniermodus</h3>
              <p className="text-xs text-slate-500">
                Gezielte Vorbereitung auf Doppel-, Mixed- & Schleifchenturniere
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollbarer Inhaltsbereich */}
        <div className="space-y-4 pt-4 overflow-y-auto flex-1 pr-1">
          {/* Hauptschalter: Turniermodus aktivieren */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-900 block">
                Turniermodus aktivieren
              </span>
              <span className="text-xs text-slate-500">
                Bindet gemeldete Paare ein & priorisiert Vorbereitungsspiele
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Basisdaten: Turniertyp, Titel & Datum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Turnierart
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('doubles')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition text-center ${
                    type === 'doubles'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Doppel- / Mixed-Turnier
                </button>
                <button
                  type="button"
                  onClick={() => setType('schleifchen')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition text-center ${
                    type === 'schleifchen'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Schleifchenturnier
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Anlass / Titel (optional)
              </label>
              <input
                type="text"
                placeholder="z. B. Kreismeisterschaft 2026"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Datum des Turniers
              </label>
              <input
                type="date"
                value={tournamentDate}
                onChange={e => setTournamentDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>

          {/* Fall A: DOPPEL / MIXED */}
          {type === 'doubles' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase">
                  Gemeldete Turnier-Paare ({pairs.length})
                </label>
              </div>

              {/* Erklärung zu Mehrfachmeldungen */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex items-start gap-2 text-amber-900 text-xs">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Tipp:</strong> Ein Spieler kann in mehreren Paaren gemeldet sein (z. B. Claus mit Simone & Claus mit Nico). Die App verteilt sie automatisch fair über die Runden des Trainingsabends.
                </p>
              </div>

              {/* Liste der bestehenden Paare */}
              {pairs.length === 0 ? (
                <div className="text-center py-4 px-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400">
                  Noch keine Turnierpaare angelegt. Wähle unten zwei Spieler aus.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {pairs.map((pair, idx) => (
                    <div
                      key={pair.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-amber-600 w-4">#{idx + 1}</span>
                        <span className="font-bold text-slate-900">{getPlayerName(pair.player1Id)}</span>
                        <span className="text-slate-400 font-semibold">&</span>
                        <span className="font-bold text-slate-900">{getPlayerName(pair.player2Id)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeletePair(pair.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                        title="Paarung entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Neues Paar hinzufügen */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Neues Paar eintragen:</span>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newPlayer1Id}
                    onChange={e => setNewPlayer1Id(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                  >
                    <option value="">Spieler 1 wählen...</option>
                    {activePlayers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Lv {p.skill})
                      </option>
                    ))}
                  </select>

                  <select
                    value={newPlayer2Id}
                    onChange={e => setNewPlayer2Id(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none"
                  >
                    <option value="">Spieler 2 wählen...</option>
                    {activePlayers
                      .filter(p => p.id !== newPlayer1Id)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Lv {p.skill})
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleAddPair}
                  disabled={!newPlayer1Id || !newPlayer2Id || newPlayer1Id === newPlayer2Id}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Paar hinzufügen
                </button>
              </div>
            </div>
          )}

          {/* Fall B: SCHLEIFCHENTURNIER */}
          {type === 'schleifchen' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase">
                    Teilnehmer Schleifchenturnier ({schleifchenPlayerIds.length})
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Erhalten 2 fordernde Spiele pro Abend gegen ebenbürtige Gegner
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllSchleifchen}
                    className="text-[11px] font-semibold text-amber-700 hover:underline"
                  >
                    Alle
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearSchleifchen}
                    className="text-[11px] font-semibold text-slate-500 hover:underline"
                  >
                    Keine
                  </button>
                </div>
              </div>

              {/* Spieler-Auswahlliste */}
              <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                {activePlayers.map(p => {
                  const isChecked = schleifchenPlayerIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleToggleSchleifchenPlayer(p.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold text-left transition border ${
                        isChecked
                          ? 'bg-amber-100 border-amber-300 text-amber-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition shadow-sm"
          >
            Einstellungen speichern
          </button>
        </div>
      </div>
    </div>
  );
};
