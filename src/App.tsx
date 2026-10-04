import { useState } from 'react';
import { Player } from './types';
import {
  loadPlayers,
  savePlayers,
  loadTrainerSkill,
  saveTrainerSkill
} from './services/storage';
import { Navbar, ActiveTab } from './components/Navbar';
import { TrainingView } from './components/TrainingView';
import { PlayerManagement } from './components/PlayerManagement';
import { TransferView } from './components/TransferView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('training');
  const [players, setPlayers] = useState<Player[]>(() => loadPlayers());
  const [trainerSkill, setTrainerSkill] = useState<number>(() => loadTrainerSkill());

  // Aktualisierung bei Datenänderung
  const refreshData = () => {
    setPlayers(loadPlayers());
    setTrainerSkill(loadTrainerSkill());
  };

  const handleUpdatePlayers = (updatedPlayers: Player[]) => {
    savePlayers(updatedPlayers);
    setPlayers(updatedPlayers);
  };

  const handleAddPlayer = (newPlayerData: Omit<Player, 'id' | 'createdAt'>) => {
    const newPlayer: Player = {
      ...newPlayerData,
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now()
    };
    const updated = [...players, newPlayer];
    savePlayers(updated);
    setPlayers(updated);
  };

  const handleUpdatePlayer = (updatedPlayer: Player) => {
    const updated = players.map(p => (p.id === updatedPlayer.id ? updatedPlayer : p));
    savePlayers(updated);
    setPlayers(updated);
  };

  const handleDeletePlayer = (id: string) => {
    const updated = players.filter(p => p.id !== id);
    savePlayers(updated);
    setPlayers(updated);
  };

  const handleUpdateTrainerSkill = (skill: number) => {
    const clamped = Math.max(1, Math.min(10, skill));
    saveTrainerSkill(clamped);
    setTrainerSkill(clamped);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Mobile-optimierte Sticky Header Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        playerCount={players.length}
      />

      {/* Hauptbereich */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'training' && (
          <TrainingView
            players={players}
            trainerSkill={trainerSkill}
            onUpdateTrainerSkill={handleUpdateTrainerSkill}
            onUpdatePlayers={handleUpdatePlayers}
          />
        )}

        {activeTab === 'players' && (
          <PlayerManagement
            players={players}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onUpdatePlayers={handleUpdatePlayers}
          />
        )}

        {activeTab === 'transfer' && (
          <TransferView onDataChanged={refreshData} />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200">
        Badminton Matchmaker • Phase 1 MVP • 100 % Offline im Browser
      </footer>
    </div>
  );
}
