import React from 'react';
import { Player, SkillProposal } from '../types';
import { Sparkles, Check, X, Award } from 'lucide-react';

interface SkillProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposals: SkillProposal[];
  onApplyProposal: (player: Player, newAdjustment: number) => void;
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
                Vorschläge zur Spielstärke
              </h3>
              <p className="text-xs text-slate-500">
                Gedämpfte Anpassung aus Ergebnissen in Runde 1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Box */}
        <div className="my-3 p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2">
          <Award className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            <strong>Keine Automatik:</strong> Du als Trainer entscheidest. Vorschläge entstehen erst nach mindestens 3 Spielen mit verschiedenen Partnern. Der Basiswert bleibt unangetastet.
          </span>
        </div>

        {/* Proposals List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-3">
          {proposals.map(prop => (
            <div key={prop.player.id} className="pt-3 first:pt-0 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{prop.player.name}</h4>
                  <div className="text-xs text-slate-500 font-medium">
                    Basis: Lv {prop.currentSkill} • Bisherige Korrektur:{' '}
                    {prop.currentAdjustment > 0 ? `+${prop.currentAdjustment}` : prop.currentAdjustment}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Neu: {prop.newEffectiveSkill} ({prop.targetAdjustment > 0 ? `+${prop.targetAdjustment}` : prop.targetAdjustment})
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                {prop.reason}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onDismissProposal(prop.player)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                >
                  Verwerfen
                </button>
                <button
                  type="button"
                  onClick={() => onApplyProposal(prop.player, prop.targetAdjustment)}
                  className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    Übernehmen ({prop.proposedDelta > 0 ? `+${prop.proposedDelta}` : prop.proposedDelta})
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Später entscheiden
          </button>

          {onApplyAll && proposals.length > 1 && (
            <button
              type="button"
              onClick={() => onApplyAll(proposals)}
              className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow transition"
            >
              Alle übernehmen
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
