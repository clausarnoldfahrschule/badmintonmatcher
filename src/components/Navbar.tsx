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
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-2 pb-2">
        {/* Dünne, dezente Überschrift darüber */}
        <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-widest pl-0.5 mb-1 select-none">
          Badminton Matchmaker
        </div>

        {/* Hauptzeile: Logo links + Tabs rechts */}
        <div className="flex items-center justify-between gap-2">
          {/* Nur das Logo links */}
          <div
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-lg text-slate-950 shadow shrink-0"
            title="Badminton Matchmaker"
          >
            🏸
          </div>

          {/* Schnellauswahl der Hauptansichten */}
          <nav className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700/60 shrink-0">
            <button
              onClick={() => onSelectTab('training')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'training'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Training</span>
            </button>

            <button
              onClick={() => onSelectTab('players')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'players'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Spieler ({playerCount})</span>
            </button>

            <button
              onClick={() => onSelectTab('transfer')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'transfer'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Vertretungs-Export & Import (Verschlüsselt)"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === 'transfer' ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>Transfer</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
