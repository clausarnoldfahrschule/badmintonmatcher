import React from 'react';
import { Calendar, Users, ShieldCheck } from 'lucide-react';

export type ActiveTab = 'training' | 'players' | 'transfer';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  playerCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, playerCount }) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-xl text-slate-950 shadow">
            🏸
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">Badminton Matchmaker</h1>
            <p className="text-xs text-emerald-400 font-medium">Hallen-Planer & Vertretungs-Manager</p>
          </div>
        </div>

        {/* Schnellauswahl der Hauptansichten */}
        <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/50">
          <button
            onClick={() => onSelectTab('training')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'training'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Training</span>
          </button>

          <button
            onClick={() => onSelectTab('players')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'players'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Spieler ({playerCount})</span>
          </button>

          <button
            onClick={() => onSelectTab('transfer')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'transfer'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
            title="Vertretungs-Export & Import (Verschlüsselt)"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Transfer</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
