import React from 'react';
import { SinglesMatch } from '../types';
import { User, Trophy, Zap } from 'lucide-react';

interface SinglesCourtCardProps {
  match: SinglesMatch;
}

export const SinglesCourtCard: React.FC<SinglesCourtCardProps> = ({ match }) => {
  const { courtNumber, player1, player2, skillDiff } = match;

  const renderSinglePlayer = (player: typeof player1, colorClass: string) => {
    return (
      <div className={`p-3 rounded-xl border flex items-center justify-between ${colorClass}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center font-bold text-xs shadow-xs text-slate-700">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">{player.name}</div>
            <div className="text-[11px] text-slate-500 font-medium">Einzelspieler</div>
          </div>
        </div>

        <span className={`text-xs font-bold px-2 py-1 rounded-md ${
          player.skill >= 8
            ? 'bg-purple-100 text-purple-700'
            : player.skill >= 6
            ? 'bg-blue-100 text-blue-700'
            : player.skill >= 4
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-amber-100 text-amber-700'
        }`}>
          Lv {player.skill}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden hover:shadow-md transition">
      {/* Court Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm tracking-wide bg-amber-950/40 px-2.5 py-0.5 rounded-md">
            FELD {courtNumber}
          </span>
          <span className="flex items-center gap-1 text-[11px] bg-amber-900/30 text-amber-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            Einzel (1 gegen 1)
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-amber-100">
          <Trophy className="w-3.5 h-3.5 text-amber-200" />
          <span>Δ {skillDiff} Diff</span>
        </div>
      </div>

      {/* 1 vs 1 Grid */}
      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
        {renderSinglePlayer(player1, 'bg-blue-50/60 border-blue-200/80')}

        {/* VS Badge */}
        <div className="sm:hidden flex items-center justify-center -my-1">
          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
            VS
          </span>
        </div>

        {renderSinglePlayer(player2, 'bg-rose-50/60 border-rose-200/80')}
      </div>
    </div>
  );
};
