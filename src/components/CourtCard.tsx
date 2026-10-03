import React from 'react';
import { Match } from '../types';
import { TRAINER_ID } from '../services/pairingEngine';
import { Trophy, Sparkles } from 'lucide-react';

interface CourtCardProps {
  match: Match;
}

export const CourtCard: React.FC<CourtCardProps> = ({ match }) => {
  const { courtNumber, team1, team2, skillDiff, roundType } = match;

  const renderPlayer = (player: typeof team1.player1, isTrainer: boolean) => {
    return (
      <div className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
        <div className="flex items-center gap-1.5 min-w-0">
          {isTrainer ? (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
              Joker
            </span>
          ) : null}
          <span className={`text-sm font-semibold truncate ${isTrainer ? 'text-amber-900 font-bold' : 'text-slate-800'}`}>
            {player.name}
          </span>
        </div>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
      {/* Court Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-sm tracking-wide bg-emerald-950/40 px-2.5 py-0.5 rounded-md">
            FELD {courtNumber}
          </span>
          {roundType === 'mentor' ? (
            <span className="flex items-center gap-1 text-[11px] bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded-full font-medium">
              <Sparkles className="w-3 h-3" /> Mentor-Doppel
            </span>
          ) : roundType === 'social' ? (
            <span className="flex items-center gap-1 text-[11px] bg-teal-500/30 text-teal-100 px-2 py-0.5 rounded-full font-medium">
              <Sparkles className="w-3 h-3" /> Sozialer Mix
            </span>
          ) : (
            <span className="text-[11px] bg-emerald-500/30 text-emerald-100 px-2 py-0.5 rounded-full font-medium">
              Niveau-Gleich
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs font-medium text-emerald-100">
          <Trophy className="w-3.5 h-3.5 text-amber-300" />
          <span>Balance: Δ {skillDiff}</span>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
        {/* Team 1 (Blau) */}
        <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/80 flex flex-col gap-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Team 1</span>
            <span className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
              Gesamt: {team1.totalSkill}
            </span>
          </div>
          {renderPlayer(team1.player1, team1.player1.id === TRAINER_ID)}
          {renderPlayer(team1.player2, team1.player2.id === TRAINER_ID)}
        </div>

        {/* Trenner VS auf Mobile */}
        <div className="sm:hidden flex items-center justify-center -my-1">
          <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">
            VS
          </span>
        </div>

        {/* Team 2 (Rot/Orange) */}
        <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/80 flex flex-col gap-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Team 2</span>
            <span className="text-xs font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
              Gesamt: {team2.totalSkill}
            </span>
          </div>
          {renderPlayer(team2.player1, team2.player1.id === TRAINER_ID)}
          {renderPlayer(team2.player2, team2.player2.id === TRAINER_ID)}
        </div>
      </div>
    </div>
  );
};
