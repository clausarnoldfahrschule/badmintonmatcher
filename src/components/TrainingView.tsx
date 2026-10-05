import { useState, useEffect, useRef } from 'react';
import { Player, SessionPlan, HistoricalPairing, MatchScore, SkillProposal, RoundPlan } from '../types';
import { generateFullSession, generateRoundPlan, sessionPlanToHistoricalPairings } from '../services/pairingEngine';
import { loadHistory, saveHistory, loadActiveSession, saveActiveSession, clearActiveSession } from '../services/storage';
import {
  accumulateSessionEvidence,
  generateSkillProposals,
  applySkillAdjustment,
  dismissSkillProposal
} from '../services/ratingService';
import { CourtCard } from './CourtCard';
import { SinglesCourtCard } from './SinglesCourtCard';
import { DropoutModal } from './DropoutModal';
import { SkillProposalModal } from './SkillProposalModal';
import { GuestModal } from './GuestModal';
import {
  Play,
  AlertTriangle,
  UserCheck,
  Coffee,
  Check,
  CheckCircle2,
  BookmarkPlus,
  RotateCcw,
  Sparkles,
  UserPlus,
  Trash2
} from 'lucide-react';

interface TrainingViewProps {
  players: Player[];
  trainerSkill: number;
  onUpdateTrainerSkill: (skill: number) => void;
  onUpdatePlayers?: (players: Player[]) => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({
  players,
  trainerSkill,
  onUpdateTrainerSkill,
  onUpdatePlayers
}) => {
  const planRef = useRef<HTMLDivElement>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // Gastspieler Modal
  const [isGuestModalOpen, setIsGuestModalOpen] = useState<boolean>(false);

  // Vorschläge zur Spielstärken-Anpassung
  const [pendingProposals, setPendingProposals] = useState<SkillProposal[]>(() =>
    generateSkillProposals(players)
  );
  const [isProposalModalOpen, setIsProposalModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setPendingProposals(generateSkillProposals(players));
  }, [players]);

  // Gespeicherten Zwischenstand aus vorheriger Sitzung (z.B. nach Browser-Refresh) laden
  const savedSession = useRef(loadActiveSession()).current;

  // Anwesenheits-Zustand pro Spieler (default: alle 3 Runden aktiv für aktive Spieler)
  const [attendance, setAttendance] = useState<
    Record<string, { round1: boolean; round2: boolean; round3: boolean }>
  >(() => {
    if (savedSession?.attendance) {
      return savedSession.attendance;
    }
    const initial: Record<string, { round1: boolean; round2: boolean; round3: boolean }> = {};
    players.forEach(p => {
      initial[p.id] = { round1: p.isActive, round2: p.isActive, round3: p.isActive };
    });
    return initial;
  });

  // Synchronisiere attendance, sobald sich die Spielerliste ändert (z.B. neue Spieler hinzugefügt)
  useEffect(() => {
    setAttendance(prev => {
      const updated = { ...prev };
      let changed = false;
      players.forEach(p => {
        if (updated[p.id] === undefined) {
          updated[p.id] = { round1: p.isActive, round2: p.isActive, round3: p.isActive };
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [players]);

  const [history, setHistory] = useState<HistoricalPairing[]>(() => loadHistory());
  const [trainerAvailable, setTrainerAvailable] = useState<boolean>(
    savedSession ? savedSession.trainerAvailable : true
  );
  const [sessionPlan, setSessionPlan] = useState<SessionPlan | null>(
    savedSession ? savedSession.sessionPlan : null
  );
  const [activeRoundTab, setActiveRoundTab] = useState<1 | 2 | 3>(
    savedSession ? savedSession.activeRoundTab : 1
  );
  const [isDropoutModalOpen, setIsDropoutModalOpen] = useState<boolean>(false);
  const [sessionSaved, setSessionSaved] = useState<boolean>(false);

  // Aktiven Trainingsabend automatisch im LocalStorage sichern
  useEffect(() => {
    saveActiveSession({
      sessionPlan,
      attendance,
      activeRoundTab,
      trainerAvailable
    });
  }, [sessionPlan, attendance, activeRoundTab, trainerAvailable]);

  // Zähle anwesende Spieler pro Runde
  const activeCountR1 = players.filter(p => attendance[p.id]?.round1).length;
  const activeCountR2 = players.filter(p => attendance[p.id]?.round2).length;
  const activeCountR3 = players.filter(p => attendance[p.id]?.round3).length;

  const toggleAll = (state: boolean) => {
    setWarningMsg(null);
    const updated: typeof attendance = {};
    players.forEach(p => {
      updated[p.id] = { round1: state, round2: state, round3: state };
    });
    setAttendance(updated);
  };

  const togglePlayerRound = (playerId: string, round: 'round1' | 'round2' | 'round3') => {
    setWarningMsg(null);
    setAttendance(prev => {
      const current = prev[playerId] || { round1: false, round2: false, round3: false };
      return {
        ...prev,
        [playerId]: {
          ...current,
          [round]: !current[round]
        }
      };
    });
  };

  const togglePlayerEntirely = (playerId: string) => {
    setWarningMsg(null);
    setAttendance(prev => {
      const current = prev[playerId] || { round1: false, round2: false, round3: false };
      const isAnyActive = current.round1 || current.round2 || current.round3;
      const nextState = !isAnyActive;
      return {
        ...prev,
        [playerId]: { round1: nextState, round2: nextState, round3: nextState }
      };
    });
  };

  const handleGeneratePlan = () => {
    const maxActive = Math.max(activeCountR1, activeCountR2, activeCountR3);
    if (maxActive < 2 && !(maxActive === 1 && trainerAvailable)) {
      setWarningMsg('Bitte wähle mindestens 2 Spieler für den Abend aus.');
      return;
    }
    setWarningMsg(null);

    const currentHist = loadHistory();
    setHistory(currentHist);
    const plan = generateFullSession(players, attendance, {
      trainerAvailable,
      trainerSkill,
      maxCourts: 8,
      historicalPairings: currentHist
    });
    setSessionPlan(plan);
    setSessionSaved(false);

    // Sanft zum generierten Spielplan scrollen
    setTimeout(() => {
      planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleUpdateMatchScore = (matchId: string, score: MatchScore | undefined) => {
    if (!sessionPlan) return;
    const newRounds = [...sessionPlan.rounds] as [RoundPlan, RoundPlan, RoundPlan];
    const r1 = newRounds[0];
    const updatedMatches = r1.matches.map(m => (m.id === matchId ? { ...m, score } : m));
    newRounds[0] = { ...r1, matches: updatedMatches };

    setSessionPlan({
      ...sessionPlan,
      rounds: newRounds
    });
    setSessionSaved(false);
  };

  const handleApplyProposal = (player: Player, newAdjustment: number) => {
    const updated = applySkillAdjustment(player, newAdjustment);
    if (onUpdatePlayers) {
      const updatedList = players.map(p => (p.id === player.id ? updated : p));
      onUpdatePlayers(updatedList);
      const remaining = generateSkillProposals(updatedList);
      setPendingProposals(remaining);
      if (remaining.length === 0) setIsProposalModalOpen(false);
    }
  };

  const handleDismissProposal = (player: Player) => {
    const updated = dismissSkillProposal(player);
    if (onUpdatePlayers) {
      const updatedList = players.map(p => (p.id === player.id ? updated : p));
      onUpdatePlayers(updatedList);
      const remaining = generateSkillProposals(updatedList);
      setPendingProposals(remaining);
      if (remaining.length === 0) setIsProposalModalOpen(false);
    }
  };

  const handleApplyAllProposals = (propsToApply: SkillProposal[]) => {
    if (!onUpdatePlayers) return;
    let list = [...players];
    for (const prop of propsToApply) {
      const updated = applySkillAdjustment(prop.player, prop.targetAdjustment);
      list = list.map(p => (p.id === prop.player.id ? updated : p));
    }
    onUpdatePlayers(list);
    setPendingProposals([]);
    setIsProposalModalOpen(false);
  };

  const handleSaveSession = () => {
    if (!sessionPlan) return;
    const newPairings = sessionPlanToHistoricalPairings(sessionPlan);
    const updatedHistory = [...history, ...newPairings];
    saveHistory(updatedHistory);
    setHistory(updatedHistory);
    setSessionSaved(true);

    // Evidenz aus Runde 1 akkumulieren
    if (onUpdatePlayers) {
      const updatedPlayers = accumulateSessionEvidence(players, sessionPlan.rounds[0], sessionPlan.date);
      onUpdatePlayers(updatedPlayers);
      const props = generateSkillProposals(updatedPlayers);
      setPendingProposals(props);
      if (props.length > 0) {
        setIsProposalModalOpen(true);
      }
    }
  };

  const handleResetSession = () => {
    const guests = players.filter(p => p.isGuest);
    let promptMsg = 'Möchtest du den aktuellen Trainingsabend abschließen/zurücksetzen und einen neuen Abend vorbereiten? Der aktuelle Spielplan wird geleert.';
    if (guests.length > 0) {
      promptMsg += `\n\nHinweis: Es waren ${guests.length} Gastspieler angemeldet. Sollen diese Gastspieler für den neuen Abend entfernt werden?`;
    }

    if (window.confirm(promptMsg)) {
      clearActiveSession();
      setSessionPlan(null);
      setSessionSaved(false);
      setActiveRoundTab(1);

      // Gäste für den nächsten Abend entfernen
      const regularPlayers = players.filter(p => !p.isGuest);
      if (onUpdatePlayers && guests.length > 0) {
        onUpdatePlayers(regularPlayers);
      }

      const resetAtt: Record<string, { round1: boolean; round2: boolean; round3: boolean }> = {};
      regularPlayers.forEach(p => {
        resetAtt[p.id] = { round1: p.isActive, round2: p.isActive, round3: p.isActive };
      });
      setAttendance(resetAtt);
    }
  };

  const handleAddGuest = (guestData: {
    name: string;
    invitedByPlayerId?: string;
    skill: number;
    rounds: { round1: boolean; round2: boolean; round3: boolean };
  }) => {
    const newGuest: Player = {
      id: `guest-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: guestData.name,
      skill: guestData.skill,
      isActive: true,
      isGuest: true,
      invitedByPlayerId: guestData.invitedByPlayerId,
      createdAt: Date.now()
    };

    setAttendance(prev => ({
      ...prev,
      [newGuest.id]: guestData.rounds
    }));

    if (onUpdatePlayers) {
      onUpdatePlayers([...players, newGuest]);
    }
  };

  const handleDeleteGuest = (guestId: string) => {
    if (window.confirm('Möchtest du diesen Gastspieler wirklich entfernen?')) {
      if (onUpdatePlayers) {
        onUpdatePlayers(players.filter(p => p.id !== guestId));
      }
      setAttendance(prev => {
        const copy = { ...prev };
        delete copy[guestId];
        return copy;
      });
    }
  };

  const handleConfirmDropout = (playerId: string, fromRound: 1 | 2 | 3) => {
    // Sicheres Deep-Cloning von attendance gegen State-Mutation
    const updatedAttendance: typeof attendance = {};
    for (const key of Object.keys(attendance)) {
      updatedAttendance[key] = { ...attendance[key] };
    }

    if (updatedAttendance[playerId]) {
      if (fromRound <= 1) updatedAttendance[playerId].round1 = false;
      if (fromRound <= 2) updatedAttendance[playerId].round2 = false;
      if (fromRound <= 3) updatedAttendance[playerId].round3 = false;
    }
    setAttendance(updatedAttendance);

    if (!sessionPlan) return;

    // Runden ab fromRound neu berechnen
    const newRounds = [...sessionPlan.rounds] as [any, any, any];

    for (let r = fromRound; r <= 3; r++) {
      const rNum = r as 1 | 2 | 3;
      const rType = rNum === 1 ? 'peer' : rNum === 2 ? 'mentor' : 'social';
      const prevRounds = newRounds.slice(0, rNum - 1);

      newRounds[rNum - 1] = generateRoundPlan({
        roundNumber: rNum,
        roundType: rType,
        players,
        attendanceMap: updatedAttendance,
        trainerAvailable,
        trainerSkill,
        maxCourts: 8,
        historicalPairings: history,
        previousRoundsCurrentSession: prevRounds
      });
    }

    setSessionPlan({
      ...sessionPlan,
      rounds: newRounds
    });
    setSessionSaved(false);
  };

  const currentRound = sessionPlan ? sessionPlan.rounds[activeRoundTab - 1] : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Vorschläge zur Spielstärken-Anpassung Banner */}
      {pendingProposals.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-3xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {pendingProposals.length} Vorschlag zur Spielstärke-Anpassung verfügbar!
              </h3>
              <p className="text-xs text-slate-600">
                Aus den Ergebnissen in Runde 1 über mehrere Trainingswochen.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsProposalModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Vorschläge ansehen
          </button>
        </div>
      )}

      {/* Check-In & Konfigurations-Bereich */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              Anwesenheit für den Trainingsabend
            </h2>
            <p className="text-xs text-slate-500">
              Wer ist heute da? Hake Spieler ab und wähle ggf. Teilzeiten aus.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAll(true)}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              Alle an
            </button>
            <button
              onClick={() => toggleAll(false)}
              className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
            >
              Alle aus
            </button>
            <button
              onClick={() => setIsGuestModalOpen(true)}
              className="text-xs font-bold px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Gast anmelden</span>
            </button>
          </div>
        </div>

        {/* Statusanzeige Teilnehmer pro Runde */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Runde 1 (Niveau)</div>
            <div className="text-lg font-extrabold text-slate-800">{activeCountR1} Spieler</div>
            <div className="text-[10px] text-slate-500">
              {Math.floor(activeCountR1 / 4)} Felder {activeCountR1 % 4 !== 0 && '(+Joker/Pause)'}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Runde 2 (Mentor)</div>
            <div className="text-lg font-extrabold text-slate-800">{activeCountR2} Spieler</div>
            <div className="text-[10px] text-slate-500">
              {Math.floor(activeCountR2 / 4)} Felder {activeCountR2 % 4 !== 0 && '(+Joker/Pause)'}
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-2xl text-center">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Runde 3 (Social)</div>
            <div className="text-lg font-extrabold text-slate-800">{activeCountR3} Spieler</div>
            <div className="text-[10px] text-slate-500">
              {Math.floor(activeCountR3 / 4)} Felder {activeCountR3 % 4 !== 0 && '(+Joker/Pause)'}
            </div>
          </div>
        </div>

        {/* Trainer-Joker Konfiguration */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={trainerAvailable}
              onChange={e => setTrainerAvailable(e.target.checked)}
              className="w-5 h-5 accent-amber-600 rounded cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-amber-950">
                Trainer als Joker / Springer aktivieren
              </span>
              <p className="text-[11px] text-amber-800/80">
                Springt ein, wenn Spieleranzahl ungerade ist, um 4er-Teams vollzumachen
              </p>
            </div>
          </label>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-900">Trainer-Stärke:</span>
            <input
              type="number"
              min={1}
              max={10}
              value={trainerSkill}
              onChange={e => onUpdateTrainerSkill(parseInt(e.target.value, 10) || 7)}
              className="w-14 text-center py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-950"
            />
          </div>
        </div>

        {/* Gastspieler Bereich (falls Gäste vorhanden) */}
        {players.some(p => p.isGuest) && (
          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                  Gastspieler heute ({players.filter(p => p.isGuest).length})
                </span>
              </div>
              <span className="text-[11px] text-indigo-700/80">
                Wird vorrangig mit Einlader gepaart • Keine Wertungskorrektur
              </span>
            </div>
            <div className="divide-y divide-indigo-100/80">
              {players
                .filter(p => p.isGuest)
                .map(guest => {
                  const host = guest.invitedByPlayerId
                    ? players.find(p => p.id === guest.invitedByPlayerId)
                    : null;
                  const att = attendance[guest.id] || { round1: false, round2: false, round3: false };
                  const isAnyActive = att.round1 || att.round2 || att.round3;

                  return (
                    <div
                      key={guest.id}
                      className="py-2 flex items-center justify-between gap-2 hover:bg-indigo-100/40 px-2 rounded-xl transition"
                    >
                      <div
                        onClick={() => togglePlayerEntirely(guest.id)}
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                            isAnyActive
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isAnyActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-indigo-950 flex items-center gap-2 truncate">
                            <span>{guest.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-200/70 text-indigo-800">
                              Gast
                            </span>
                          </div>
                          <div className="text-[11px] text-indigo-700/80">
                            {host ? `Eingeladen von: ${host.name}` : 'Spontan / Ohne Einladung'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 mr-1">
                          Lv {guest.skill}
                        </span>

                        {/* Einzelne Runden-Buttons */}
                        {(['round1', 'round2', 'round3'] as const).map((rKey, idx) => {
                          const active = att[rKey];
                          return (
                            <button
                              key={rKey}
                              type="button"
                              onClick={() => togglePlayerRound(guest.id, rKey)}
                              className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition ${
                                active
                                  ? 'bg-indigo-600 text-white border-indigo-700'
                                  : 'bg-white text-slate-400 border-slate-200 hover:bg-indigo-50'
                              }`}
                            >
                              R{idx + 1}
                            </button>
                          );
                        })}

                        <button
                          type="button"
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition ml-1"
                          title="Gast entfernen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Spielerliste Check-In */}
        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
          {players.filter(p => !p.isGuest).map(player => {
            const att = attendance[player.id] || { round1: false, round2: false, round3: false };
            const isAnyActive = att.round1 || att.round2 || att.round3;

            return (
              <div
                key={player.id}
                className="py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 px-2 rounded-xl transition"
              >
                <div
                  onClick={() => togglePlayerEntirely(player.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      isAnyActive
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isAnyActive && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {player.name}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 mr-2">
                    Lv {player.skill}
                  </span>

                  {/* Einzelne Runden-Buttons */}
                  {(['round1', 'round2', 'round3'] as const).map((rKey, idx) => {
                    const active = att[rKey];
                    return (
                      <button
                        key={rKey}
                        type="button"
                        onClick={() => togglePlayerRound(player.id, rKey)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition ${
                          active
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        R{idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Warnung bei zu wenigen Spielern */}
        {warningMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{warningMsg}</span>
          </div>
        )}

        {/* Großer CTA-Button zum Generieren */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <button
            onClick={handleGeneratePlan}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-base transition active:scale-[0.99]"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>🏸 Spielplan für heute berechnen</span>
          </button>
        </div>
      </section>

      {/* Spielplan-Ergebnis */}
      {sessionPlan && currentRound && (
        <section ref={planRef} className="space-y-4 scroll-mt-20">
          {/* Runden-Auswahl Tabs */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
              {([1, 2, 3] as const).map(rnd => {
                const title =
                  rnd === 1
                    ? 'Runde 1: Niveau'
                    : rnd === 2
                    ? 'Runde 2: Mentor'
                    : 'Runde 3: Social';
                return (
                  <button
                    key={rnd}
                    onClick={() => setActiveRoundTab(rnd)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                      activeRoundTab === rnd
                        ? 'bg-slate-900 text-white shadow'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {title}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {/* Neuer Abend / Reset Button */}
              <button
                onClick={handleResetSession}
                className="flex items-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs"
                title="Aktuellen Spielplan verwerfen und neuen Trainingsabend vorbereiten"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Neuer Abend</span>
              </button>

              {/* Spontanausfall Button */}
              <button
                onClick={() => setIsDropoutModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition shadow-2xs"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Ausfall melden</span>
              </button>
            </div>
          </div>

          {/* Banner für Runden-Details */}
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-950 font-medium">
            <div>
              {currentRound.roundType === 'peer' && (
                <span>
                  🎯 <strong>Niveau-Gleichheit:</strong> Felder nach Spielstärke geclustert (Starke vs. Starke, Einsteiger vs. Einsteiger).
                </span>
              )}
              {currentRound.roundType === 'mentor' && (
                <span>
                  🌱 <strong>Mentor-Modus:</strong> Jeweils 1 erfahrener + 1 lernender Spieler bilden ein ausgeglichenes Team.
                </span>
              )}
              {currentRound.roundType === 'social' && (
                <span>
                  🤝 <strong>Sozialer Mix:</strong> Maximale Konstellations-Abwechslung und neue Spielpartner.
                </span>
              )}
            </div>

            {currentRound.trainerParticipated && (
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold text-[11px] whitespace-nowrap">
                Trainer spielt mit
              </span>
            )}
          </div>

          {/* Hinweis falls keine Spiele zustande kamen */}
          {currentRound.matches.length === 0 && !currentRound.singlesMatch && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-900">
              <p className="font-bold text-sm">Keine Spiele für Runde {activeRoundTab} möglich</p>
              <p className="text-xs mt-1 text-amber-700">
                Für diese Runde wurden zu wenige Spieler ausgewählt. Mindestens 2 Spieler werden für ein Einzel oder 3 Spieler + Trainer für ein Doppel benötigt.
              </p>
            </div>
          )}

          {/* Spielfelder Grid (Doppel + optionales 1vs1 Einzel) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentRound.matches.map(match => (
              <CourtCard
                key={match.id}
                match={match}
                onUpdateScore={activeRoundTab === 1 ? handleUpdateMatchScore : undefined}
              />
            ))}

            {currentRound.singlesMatch && (
              <SinglesCourtCard match={currentRound.singlesMatch} />
            )}
          </div>

          {/* Pausierende Spieler (Überhang) */}
          {currentRound.restingPlayers.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2 bg-slate-200 text-slate-600 rounded-xl">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pausiert in Runde {activeRoundTab}
                </h4>
                <div className="text-sm font-semibold text-slate-800 mt-0.5">
                  {currentRound.restingPlayers.map(p => p.name).join(', ')}
                </div>
              </div>
            </div>
          )}

          {/* Abschluss & Historie sichern */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Trainingsabend dokumentieren</h4>
              <p className="text-[11px] text-slate-500">
                Speichert alle heutigen Paarungen, damit nächste Woche neue Kombinationen bevorzugt werden.
              </p>
            </div>

            <button
              onClick={handleSaveSession}
              disabled={sessionSaved}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow ${
                sessionSaved
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {sessionSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>In Historie gespeichert ✓</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4 text-emerald-400" />
                  <span>Abend abschließen & in Historie sichern</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* Spontanausfall Modal */}
      <DropoutModal
        isOpen={isDropoutModalOpen}
        onClose={() => setIsDropoutModalOpen(false)}
        players={players}
        activeRound={activeRoundTab}
        attendanceMap={attendance}
        onConfirmDropout={handleConfirmDropout}
      />

      {/* Vorschlags-Modal zur Spielstärken-Freigabe */}
      <SkillProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        proposals={pendingProposals}
        onApplyProposal={handleApplyProposal}
        onDismissProposal={handleDismissProposal}
        onApplyAll={handleApplyAllProposals}
      />

      {/* Gast anmelden Modal */}
      <GuestModal
        isOpen={isGuestModalOpen}
        onClose={() => setIsGuestModalOpen(false)}
        availableHosts={players.filter(p => !p.isGuest)}
        onAddGuest={handleAddGuest}
      />
    </div>
  );
};
