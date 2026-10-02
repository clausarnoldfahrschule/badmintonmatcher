import { useState } from 'react';
import { Player } from '../types';
import { Plus, Search, Edit3, Trash2, UserCheck, UserX, X } from 'lucide-react';

interface PlayerManagementProps {
  players: Player[];
  onAddPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
}

export const PlayerManagement: React.FC<PlayerManagementProps> = ({
  players,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer
}) => {
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form State
  const [name, setName] = useState<string>('');
  const [skill, setSkill] = useState<number>(5);
  const [isActive, setIsActive] = useState<boolean>(true);

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = players.filter(p => p.isActive).length;
  const avgSkill = players.length
    ? Math.round((players.reduce((sum, p) => sum + p.skill, 0) / players.length) * 10) / 10
    : 0;

  const handleOpenAdd = () => {
    setEditingPlayer(null);
    setName('');
    setSkill(5);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (player: Player) => {
    setEditingPlayer(player);
    setName(player.name);
    setSkill(player.skill);
    setIsActive(player.isActive);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPlayer) {
      onUpdatePlayer({
        ...editingPlayer,
        name: name.trim(),
        skill,
        isActive
      });
    } else {
      onAddPlayer({
        name: name.trim(),
        skill,
        isActive
      });
    }

    setIsModalOpen(false);
  };

  const getSkillLabel = (val: number) => {
    if (val >= 9) return 'Liga / Top';
    if (val >= 7) return 'Stark / Ambitioniert';
    if (val >= 4) return 'Solider Hobby-Spieler';
    return 'Einsteiger / Anfänger';
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header & Stats */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Spieler-Stammdaten</h2>
            <p className="text-xs text-slate-500">
              Verwalte Mitglieder, Spielstärken (1-10) und Status für die Trainingsabende.
            </p>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Neuer Spieler</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Gesamt</div>
            <div className="text-lg font-extrabold text-slate-800">{players.length}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Aktiv</div>
            <div className="text-lg font-extrabold text-emerald-600">{activeCount}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Ø Stärke</div>
            <div className="text-lg font-extrabold text-slate-800">{avgSkill}</div>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Spieler suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </section>

      {/* Spielerliste */}
      <section className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 divide-y divide-slate-100">
        {filteredPlayers.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-medium">
            Keine Spieler gefunden.
          </div>
        ) : (
          filteredPlayers.map(player => (
            <div
              key={player.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => onUpdatePlayer({ ...player, isActive: !player.isActive })}
                  title={player.isActive ? 'Als pausierend markieren' : 'Als aktiv markieren'}
                  className={`p-1.5 rounded-lg border transition ${
                    player.isActive
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                      : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {player.isActive ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                </button>

                <div className="min-w-0">
                  <div className={`text-sm font-bold truncate ${player.isActive ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                    {player.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {getSkillLabel(player.skill)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                  player.skill >= 8
                    ? 'bg-purple-100 text-purple-700'
                    : player.skill >= 6
                    ? 'bg-blue-100 text-blue-700'
                    : player.skill >= 4
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  Stärke {player.skill}
                </span>

                <button
                  onClick={() => handleOpenEdit(player)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  title="Bearbeiten"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Spieler "${player.name}" wirklich löschen?`)) {
                      onDeletePlayer(player.id);
                    }
                  }}
                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                  title="Löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Modal: Spieler anlegen / bearbeiten */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingPlayer ? 'Spieler bearbeiten' : 'Neuen Spieler anlegen'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Name / Kürzel
                </label>
                <input
                  type="text"
                  required
                  placeholder="z. B. Max M."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Spielstärke (1 bis 10)
                  </label>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {skill} - {getSkillLabel(skill)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={skill}
                  onChange={e => setSkill(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-bold">
                  <span>1 (Anfänger)</span>
                  <span>5 (Mittel)</span>
                  <span>10 (Liga)</span>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">Aktives Gruppenmitglied</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow transition"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
