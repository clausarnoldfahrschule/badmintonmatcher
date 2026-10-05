import React from 'react';
import { SinglesMatch } from '../types';
import { User, Trophy, Zap, Sparkles } from 'lucide-react';

interface SinglesCourtCardProps {
  match: SinglesMatch;
}

export const SinglesCourtCard: React.FC<SinglesCourtCardProps> = ({ match }) => {
  const { courtNumber, isTrainerChallenge, player1, player2, player3, skillDiff } = match;

  const renderPlayer = (player: typeof player1, subtitle: string, isTrainer: boolean) => {
    return (
      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
        isTrainer ? 'bg-amber-50/80 border-amber-300' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs ${
            isTrainer ? 'bg-amber-500 text-white' : 'bg-white text-slate-700'
          }`}>
            <User className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              {player.isGuest && (
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                  Gast
                </span>
              )}
              <span className={`text-sm font-bold truncate ${isTrainer ? 'text-amber-950' : 'text-slate-900'}`}>
                {player.name}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium">{subtitle}</div>
          </div>
        </div>

        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
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

  if (isTrainerChallenge && player3) {
    const pairTotal = player2.skill + player3.skill;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-purple-200 overflow-hidden hover:shadow-md transition">
        {/* Court Header: Trainer-Challenge */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 px-4 py-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-wide bg-purple-950/40 px-2.5 py-0.5 rounded-md">
              FELD {courtNumber}
            </span>
            <span className="flex items-center gap-1 text-[11px] bg-purple-900/40 text-purple-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 fill-purple-300 text-purple-300" />
              Trainer-Challenge (1 vs. 2)
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-purple-200">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Δ {skillDiff} Diff</span>
          </div>
        </div>

        {/* 1 Trainer vs 2 Anfänger Grid */}
        <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
          {/* Trainer Alleine */}
          <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80 flex flex-col justify-between">
            <div className="text-[11px] font-bold text-amber-800 uppercase mb-1">
              Trainer (Einzelspieler)
            </div>
            {renderPlayer(player1, 'Spielt alleine', true)}
          </div>

          {/* Trenner VS */}
          <div className="sm:hidden flex items-center justify-center -my-1">
            <span className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-0.5 rounded-full">
              VS
            </span>
          </div>

          {/* Doppel der 2 Einsteiger */}
          <div className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-200/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                Einsteiger-Doppel
              </span>
              <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-md">
                Summe: {pairTotal}
              </span>
            </div>
            {renderPlayer(player2, 'Einsteiger-Team', false)}
            {renderPlayer(player3, 'Einsteiger-Team', false)}
          </div>
        </div>
      </div>
    );
  }

  // Reguläres 1vs1 Einzel
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
        {renderPlayer(player1, 'Einzelspieler', false)}

        <div className="sm:hidden flex items-center justify-center -my-1">
          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
            VS
          </span>
        </div>

        {renderPlayer(player2, 'Einzelspieler', false)}
      </div>
    </div>
  );
};
