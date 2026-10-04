import React, { useState } from 'react';
import { Match, MatchScore } from '../types';
import { TRAINER_ID, getEffectiveSkill } from '../services/pairingEngine';
import { calculateScoreDifference, isScoreComplete } from '../services/ratingService';
import { Trophy, Sparkles, ChevronDown, Check, Edit2 } from 'lucide-react';

interface CourtCardProps {
  match: Match;
  onUpdateScore?: (matchId: string, score: MatchScore | undefined) => void;
}

export const CourtCard: React.FC<CourtCardProps> = ({ match, onUpdateScore }) => {
  const { id: matchId, courtNumber, team1, team2, skillDiff, roundType, score } = match;

  const [isEditingScore, setIsEditingScore] = useState<boolean>(false);
  const [s1T1, setS1T1] = useState<number>(score?.set1Team1 ?? 21);
  const [s1T2, setS1T2] = useState<number>(score?.set1Team2 ?? 18);
  const [s2T1, setS2T1] = useState<number>(score?.set2Team1 ?? 21);
  const [s2T2, setS2T2] = useState<number>(score?.set2Team2 ?? 15);

  const hasScore = score && isScoreComplete(score);

  const renderPlayer = (player: typeof team1.player1, isTrainer: boolean) => {
    const effSkill = getEffectiveSkill(player);
    const hasAdjustment = player.skillAdjustment && Math.abs(player.skillAdjustment) >= 0.1;

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
        <div className="flex items-center gap-1">
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${
            effSkill >= 8
              ? 'bg-purple-100 text-purple-700'
              : effSkill >= 6
              ? 'bg-blue-100 text-blue-700'
              : effSkill >= 4
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            Lv {player.skill}
            {hasAdjustment && (
              <span className="text-[10px] opacity-80 ml-0.5">
                ({player.skillAdjustment! > 0 ? `+${player.skillAdjustment}` : player.skillAdjustment})
              </span>
            )}
          </span>
        </div>
      </div>
    );
  };

  const handleSaveScore = () => {
    if (!onUpdateScore) return;
    const newScore: MatchScore = {
      set1Team1: Math.max(0, s1T1),
      set1Team2: Math.max(0, s1T2),
      set2Team1: Math.max(0, s2T1),
      set2Team2: Math.max(0, s2T2)
    };
    onUpdateScore(matchId, newScore);
    setIsEditingScore(false);
  };

  const handleClearScore = () => {
    if (!onUpdateScore) return;
    onUpdateScore(matchId, undefined);
    setIsEditingScore(false);
  };

  // Preview der Auswertung während des Editierens
  const currentDiff = (s1T1 + s2T1) - (s1T2 + s2T2);
  const absDiff = Math.abs(currentDiff);
  const diffCategory =
    absDiff < 10
      ? 'Ausgeglichen (Δ unter 10 Pkt.)'
      : absDiff <= 20
      ? currentDiff > 0 ? 'Team 1 im Vorteil (Δ 10–20 Pkt.)' : 'Team 2 im Vorteil (Δ 10–20 Pkt.)'
      : currentDiff > 0 ? 'Klarer Sieg Team 1 (Δ > 20 Pkt.)' : 'Klarer Sieg Team 2 (Δ > 20 Pkt.)';

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

      {/* Optionale Ergebniserfassung (Nur in Runde 1 / Niveau-Gleichheit) */}
      {roundType === 'peer' && onUpdateScore && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-3.5 py-2.5">
          {!isEditingScore ? (
            <div className="flex items-center justify-between gap-2">
              {hasScore ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-800">
                    Ergebnis: {score.set1Team1}:{score.set1Team2}, {score.set2Team1}:{score.set2Team2}
                  </span>
                  {(() => {
                    const diffObj = calculateScoreDifference(score);
                    const diff = diffObj.diff;
                    const isBal = Math.abs(diff) < 10;
                    return (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isBal
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isBal ? 'Ausgeglichen' : diff > 0 ? 'Sieg Team 1' : 'Sieg Team 2'} (Δ {Math.abs(diff)} Pkt.)
                      </span>
                    );
                  })()}
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-medium italic">
                  Kein Ergebnis erfasst (optional)
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  if (score) {
                    setS1T1(score.set1Team1);
                    setS1T2(score.set1Team2);
                    setS2T1(score.set2Team1);
                    setS2T2(score.set2Team2);
                  }
                  setIsEditingScore(true);
                }}
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition shadow-2xs"
              >
                {hasScore ? (
                  <>
                    <Edit2 className="w-3 h-3" />
                    <span>Ändern</span>
                  </>
                ) : (
                  <>
                    <span>+ Ergebnis erfassen</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Ergebnis (2 Sätze) eintragen:
                </span>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {diffCategory}
                </span>
              </div>

              {/* Satz 1 */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Satz 1:
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xs font-bold text-blue-700 w-12 truncate">Team 1</span>
                    <input
                      type="number"
                      min={0}
                      max={35}
                      value={s1T1}
                      onChange={e => setS1T1(parseInt(e.target.value, 10) || 0)}
                      className="w-14 text-center py-1 bg-slate-50 border border-slate-300 rounded-lg text-sm font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-slate-400 font-extrabold">:</span>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <input
                      type="number"
                      min={0}
                      max={35}
                      value={s1T2}
                      onChange={e => setS1T2(parseInt(e.target.value, 10) || 0)}
                      className="w-14 text-center py-1 bg-slate-50 border border-slate-300 rounded-lg text-sm font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-rose-700 w-12 text-right truncate">Team 2</span>
                  </div>
                </div>
              </div>

              {/* Satz 2 */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Satz 2:
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xs font-bold text-blue-700 w-12 truncate">Team 1</span>
                    <input
                      type="number"
                      min={0}
                      max={35}
                      value={s2T1}
                      onChange={e => setS2T1(parseInt(e.target.value, 10) || 0)}
                      className="w-14 text-center py-1 bg-slate-50 border border-slate-300 rounded-lg text-sm font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-slate-400 font-extrabold">:</span>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <input
                      type="number"
                      min={0}
                      max={35}
                      value={s2T2}
                      onChange={e => setS2T2(parseInt(e.target.value, 10) || 0)}
                      className="w-14 text-center py-1 bg-slate-50 border border-slate-300 rounded-lg text-sm font-extrabold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-rose-700 w-12 text-right truncate">Team 2</span>
                  </div>
                </div>
              </div>

              {/* Schnellauswahl / Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400">Schnell:</span>
                <button
                  type="button"
                  onClick={() => { setS1T1(21); setS1T2(18); setS2T1(21); setS2T2(17); }}
                  className="text-[10px] px-2 py-0.5 bg-slate-200/80 hover:bg-slate-300 rounded text-slate-700 font-semibold transition"
                >
                  21:18, 21:17 (T1)
                </button>
                <button
                  type="button"
                  onClick={() => { setS1T1(21); setS1T2(12); setS2T1(21); setS2T2(10); }}
                  className="text-[10px] px-2 py-0.5 bg-slate-200/80 hover:bg-slate-300 rounded text-slate-700 font-semibold transition"
                >
                  21:12, 21:10 (T1+)
                </button>
                <button
                  type="button"
                  onClick={() => { setS1T1(18); setS1T2(21); setS2T1(17); setS2T2(21); }}
                  className="text-[10px] px-2 py-0.5 bg-slate-200/80 hover:bg-slate-300 rounded text-slate-700 font-semibold transition"
                >
                  18:21, 17:21 (T2)
                </button>
                <button
                  type="button"
                  onClick={() => { setS1T1(21); setS1T2(19); setS2T1(19); setS2T2(21); }}
                  className="text-[10px] px-2 py-0.5 bg-slate-200/80 hover:bg-slate-300 rounded text-slate-700 font-semibold transition"
                >
                  21:19, 19:21 (Patt)
                </button>
              </div>

              {/* Aktionen */}
              <div className="flex items-center justify-between pt-1">
                {hasScore ? (
                  <button
                    type="button"
                    onClick={handleClearScore}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition"
                  >
                    Ergebnis löschen
                  </button>
                ) : <span />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingScore(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveScore}
                    className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Speichern</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
