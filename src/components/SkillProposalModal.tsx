import React from 'react';
import { Player, SkillProposal } from '../types';
import { Sparkles, Check, X, Award, TrendingUp, TrendingDown } from 'lucide-react';

interface SkillProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: SkillProposal[];
  onApplyProposal: (proposal: SkillProposal) => void;
  onDismissProposal: (player: Player) => void;
  onApplyAll?: (proposals: SkillProposal[]) => void;
}

export const SkillProposalModal: React.FC<SkillProposalModalProps> = ({
  isOpen,
  onClose,
  proposals,
  onApplyProposal,
  onDismissProposal,
  onApplyAll
}) => {
  if (!isOpen || proposals.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Stufenwechsel vorschlagen
              </h3>
              <p className="text-xs text-slate-500">
                Auf- oder Abstieg der Basis-Spielstärke (1 bis 10)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Box für Trainer Siggi */}
        <div className="my-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
          <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Keine Flut an Zwischenfragen:</strong> Kleine Anpassungen laufen lautlos im Hintergrund. Hier wirst du nur gefragt, wenn ein Spieler nach mehreren Wochen eine echte Stufe auf- oder absteigen sollte. Du entscheidest!
          </span>
        </div>

        {/* Proposals List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-3">
          {proposals.map(prop => {
            const isPromo = prop.type === 'promotion';

            return (
              <div key={prop.player.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{prop.player.name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isPromo
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isPromo ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            <span>Aufstieg</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3 text-amber-600" />
                            <span>Anpassung</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      Bisher: Stufe {prop.currentSkill} (Zusatzwert:{' '}
                      {prop.currentAdjustment > 0 ? `+${prop.currentAdjustment}` : prop.currentAdjustment})
                    </div>
                  </div>

                  {/* Stufen-Wechsel Vorschau */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                    <span className="text-xs font-bold text-slate-500">Lv {prop.currentSkill}</span>
                    <span className="text-slate-400 font-bold">➔</span>
                    <span className={`text-sm font-extrabold ${
                      isPromo ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      Lv {prop.targetSkill}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {prop.reason}
                  <span className="block mt-0.5 text-[10px] text-slate-400">
                    Bei Bestätigung wird der Basiswert auf {prop.targetSkill} gesetzt und der Zusatzwert auf 0 zurückgesetzt.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onDismissProposal(prop.player)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                  >
                    Auf Stufe {prop.currentSkill} belassen
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyProposal(prop)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white rounded-lg shadow-sm transition ${
                      isPromo
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Auf Stufe {prop.targetSkill} {isPromo ? 'befördern' : 'anpassen'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Später entscheiden
          </button>

          {onApplyAll && proposals.length > 1 && (
            <button
              type="button"
              onClick={() => onApplyAll(proposals)}
              className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow transition cursor-pointer"
            >
              Alle Vorschläge annehmen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
