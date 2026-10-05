import React, { useState } from 'react';
import { Player } from '../types';
import { UserPlus, X, Heart, ShieldAlert } from 'lucide-react';

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableHosts: Player[]; // Stammspieler zur Auswahl als einladender Freund
  onAddGuest: (guestData: {
    name: string;
    invitedByPlayerId?: string;
    skill: number;
    rounds: { round1: boolean; round2: boolean; round3: boolean };
  }) => void;
}

export const GuestModal: React.FC<GuestModalProps> = ({
  isOpen,
  onClose,
  availableHosts,
  onAddGuest
}) => {
  const [name, setName] = useState<string>('');
  const [invitedByPlayerId, setInvitedByPlayerId] = useState<string>('');
  const [skill, setSkill] = useState<number>(5);
  const [round1, setRound1] = useState<boolean>(true);
  const [round2, setRound2] = useState<boolean>(true);
  const [round3, setRound3] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddGuest({
      name: name.trim(),
      invitedByPlayerId: invitedByPlayerId || undefined,
      skill,
      rounds: { round1, round2, round3 }
    });

    // Formular zurücksetzen & schließen
    setName('');
    setInvitedByPlayerId('');
    setSkill(5);
    setRound1(true);
    setRound2(true);
    setRound3(true);
    onClose();
  };

  const getSkillLabel = (val: number) => {
    if (val >= 9) return 'Liga / Top-Niveau';
    if (val >= 7) return 'Fortgeschritten / Ambitioniert';
    if (val >= 4) return 'Solider Hobby-Spieler';
    return 'Einsteiger / Anfänger';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Gastspieler anmelden</h3>
              <p className="text-xs text-slate-500">
                Spontaner Schnupperer oder Gast eines Mitglieds
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

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Gast Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Name des Gastes *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="z. B. Lukas oder Sarah"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Eingeladen von */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
              <span>Eingeladen von (Freund / Host)</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            </label>
            <select
              value={invitedByPlayerId}
              onChange={e => setInvitedByPlayerId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="">— Ohne Einladung (Spontaner Gast) —</option>
              {availableHosts
                .filter(p => !p.isGuest)
                .map(host => (
                  <option key={host.id} value={host.id}>
                    {host.name} (Stärke {host.skill})
                  </option>
                ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Gast und Freund spielen bevorzugt zusammen auf demselben Feld (mit- oder gegeneinander).
            </p>
          </div>

          {/* Geschätzte Spielstärke */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                Geschätzte Spielstärke (1 bis 10)
              </label>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                Lv {skill} • {getSkillLabel(skill)}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={skill}
              onChange={e => setSkill(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-0.5">
              <span>1 (Anfänger)</span>
              <span>5 (Hobby)</span>
              <span>10 (Liga)</span>
            </div>
          </div>

          {/* Runden-Teilnahme */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Teilnahme an Runden
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold cursor-pointer transition select-none ${
                round1
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={round1}
                  onChange={e => setRound1(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>Runde 1</span>
              </label>

              <label className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold cursor-pointer transition select-none ${
                round2
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={round2}
                  onChange={e => setRound2(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>Runde 2</span>
              </label>

              <label className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold cursor-pointer transition select-none ${
                round3
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}>
                <input
                  type="checkbox"
                  checked={round3}
                  onChange={e => setRound3(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>Runde 3</span>
              </label>
            </div>
          </div>

          {/* Hinweis Rating-Schutz */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Rating-Schutz aktiv:</strong> Matches mit Gastspielern werden niemals für Spielstärken-Korrekturen ausgewertet.
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Gast hinzufügen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
