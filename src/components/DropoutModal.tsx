import React, { useState } from 'react';
import { Player } from '../types';
import { AlertTriangle, X } from 'lucide-react';

interface DropoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  activeRound: 1 | 2 | 3;
  onConfirmDropout: (playerId: string, fromRound: 1 | 2 | 3) => void;
}

export const DropoutModal: React.FC<DropoutModalProps> = ({
  isOpen,
  onClose,
  players,
  activeRound,
  onConfirmDropout
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [fromRound, setFromRound] = useState<1 | 2 | 3>(activeRound);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedPlayerId) return;
    onConfirmDropout(selectedPlayerId, fromRound);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-bold text-slate-900">Spontanausfall melden</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Hat sich jemand verletzt oder muss früher gehen? Wähle den Spieler aus. Die folgenden Runden werden automatisch ohne ihn neu berechnet. Bereits gespielte Runden bleiben erhalten!
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Wer fällt aus?
            </label>
            <select
              value={selectedPlayerId}
              onChange={e => setSelectedPlayerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Spieler auswählen --</option>
              {players.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stärke {p.skill})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Ab welcher Runde?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map(rnd => (
                <button
                  key={rnd}
                  type="button"
                  onClick={() => setFromRound(rnd)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition ${
                    fromRound === rnd
                      ? 'bg-amber-500 text-white border-amber-600 shadow'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Ab Runde {rnd}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Abbrechen
          </button>
          <button
            type="button"
            disabled={!selectedPlayerId}
            onClick={handleConfirm}
            className="px-5 py-2.5 text-sm font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow disabled:opacity-50 transition"
          >
            Ausfall bestätigen & Neu berechnen
          </button>
        </div>
      </div>
    </div>
  );
};
