import React, { useState } from 'react';
import { exportEncryptedBackup, importEncryptedBackup, resetToDemo, loadPlayers } from '../services/storage';
import { QrShowModal } from './QrShowModal';
import { QrScanModal } from './QrScanModal';
import { ShieldCheck, Download, Upload, KeyRound, AlertCircle, CheckCircle, RefreshCcw, QrCode, Camera, Sparkles } from 'lucide-react';

interface TransferViewProps {
  onDataChanged: () => void;
}

export const TransferView: React.FC<TransferViewProps> = ({ onDataChanged }) => {
  // QR-Code State
  const [isQrShowOpen, setIsQrShowOpen] = useState<boolean>(false);
  const [isQrScanOpen, setIsQrScanOpen] = useState<boolean>(false);

  // Export State
  const [exportPassword, setExportPassword] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Import State
  const [importPassword, setImportPassword] = useState<string>('');
  const [importFileContent, setImportFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Status-Nachrichten
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const players = loadPlayers();

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassword.trim()) {
      setStatusMsg({ type: 'error', text: 'Bitte gib ein Passwort für die Verschlüsselung ein.' });
      return;
    }

    try {
      setIsExporting(true);
      setStatusMsg(null);
      const encryptedData = await exportEncryptedBackup(exportPassword);

      // Download als .enc Datei
      const blob = new Blob([encryptedData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `badminton-backup-${dateStr}.enc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatusMsg({
        type: 'success',
        text: 'Backup erfolgreich verschlüsselt und heruntergeladen! Sende die .enc-Datei einfach per WhatsApp an deine Vertretung.'
      });
      setExportPassword('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Fehler beim Verschlüsseln der Daten.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = event => {
      setImportFileContent(event.target?.result as string || '');
    };
    reader.readAsText(file);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFileContent.trim()) {
      setStatusMsg({ type: 'error', text: 'Bitte wähle zuerst eine Backup-Datei aus.' });
      return;
    }
    if (!importPassword.trim()) {
      setStatusMsg({ type: 'error', text: 'Bitte gib das Passwort zur Entschlüsselung ein.' });
      return;
    }

    try {
      setIsImporting(true);
      setStatusMsg(null);
      const result = await importEncryptedBackup(importFileContent, importPassword);
      setStatusMsg({
        type: 'success',
        text: `Erfolgreich importiert! ${result.playersCount} Spieler und ${result.historyCount} Historien-Einträge geladen.`
      });
      setImportPassword('');
      setImportFileContent('');
      setFileName('');
      onDataChanged();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Fehler beim Entschlüsseln.' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    if (confirm('Möchtest du wirklich alle Daten löschen und die Demo-Spieler wiederherstellen?')) {
      resetToDemo();
      onDataChanged();
      setStatusMsg({ type: 'success', text: 'Demo-Daten erfolgreich wiederhergestellt.' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Schnellübergabe per QR-Code (Primary / Empfohlen) */}
      <section className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white rounded-3xl p-6 shadow-lg border border-emerald-500/30">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 backdrop-blur-xs text-white rounded-2xl border border-white/20">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Schnellübergabe per QR-Code</h2>
                <span className="px-2 py-0.5 bg-emerald-400 text-emerald-950 text-[10px] font-black rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Empfohlen
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                Display an Display in der Halle – ohne Datei, E-Mail oder WhatsApp!
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          {/* Trainer zeigt QR */}
          <button
            type="button"
            onClick={() => setIsQrShowOpen(true)}
            className="p-4 bg-white/10 hover:bg-white/20 active:scale-[0.98] transition border border-white/20 rounded-2xl text-left flex items-start gap-3.5 group cursor-pointer"
          >
            <div className="p-2.5 bg-white text-emerald-700 rounded-xl shrink-0 shadow-sm group-hover:scale-105 transition">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>QR-Code anzeigen</span>
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-1 leading-snug">
                Trainer geht in den Urlaub: Erzeugt den Übergabe-Code für die Vertretung.
              </p>
            </div>
          </button>

          {/* Vertretung scannt QR */}
          <button
            type="button"
            onClick={() => setIsQrScanOpen(true)}
            className="p-4 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 active:scale-[0.98] transition rounded-2xl text-left flex items-start gap-3.5 shadow-md group cursor-pointer"
          >
            <div className="p-2.5 bg-emerald-950 text-emerald-300 rounded-xl shrink-0 group-hover:scale-105 transition">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950">
                Kamera öffnen & scannen
              </div>
              <p className="text-[11px] text-emerald-900/90 mt-1 leading-snug font-medium">
                Vertretung übernimmt Training: Scannt den QR-Code vom Trainer-Handy ab.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* DSGVO Info Header */}
      <section className="bg-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Datenschutz & Verschlüsselung (DSGVO)</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Spielernamen sind personenbezogene Daten. Beim Datei-Export wird die gesamte Datenbank mit 
              <strong> AES-GCM (256-bit)</strong> und einem Passwort verschlüsselt. Auch bei der QR-Code Schnellübergabe 
              erfolgt der Transfer 100% lokal von Display zu Display ohne Internetserver.
            </p>
          </div>
        </div>
      </section>

      {/* Status-Feedback */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 text-xs font-semibold border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Trennlinie Datei-Transfer */}
      <div className="flex items-center gap-3 my-2">
        <div className="h-px bg-slate-200 flex-1" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Oder klassischer Datei-Transfer (.enc)
        </span>
        <div className="h-px bg-slate-200 flex-1" />
      </div>

      {/* Grid: Export & Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* EXPORT (Trainer geht in den Urlaub) */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-emerald-700">
              <Download className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Daten verschlüsselt exportieren</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Erstellt eine geschützte Backup-Datei für deine Vertretung (z. B. Versand per WhatsApp).
            </p>

            <form onSubmit={handleExport} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Verschlüsselungs-Passwort vergeben
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Sicheres Passwort eingeben..."
                    value={exportPassword}
                    onChange={e => setExportPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Teile dieses Passwort deiner Vertretung mit (z. B. im Chat).
                </span>
              </div>

              <button
                type="submit"
                disabled={isExporting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Verschlüssele...' : 'Backup herunterladen (.enc)'}</span>
              </button>
            </form>
          </div>
        </section>

        {/* IMPORT (Vertretung übernimmt Training) */}
        <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2 text-blue-700">
              <Upload className="w-5 h-5" />
              <h3 className="text-sm font-bold text-slate-900">Backup entschlüsseln & importieren</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Lade die Datei hoch, die du vom Trainer erhalten hast.
            </p>

            <form onSubmit={handleImport} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Sicherungsdatei (.enc)
                </label>
                <input
                  type="file"
                  accept=".enc,.json"
                  onChange={handleFileSelect}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                {fileName && (
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 block truncate">
                    Ausgewählt: {fileName}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Passwort zur Entschlüsselung
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Vom Trainer erhaltenes Passwort..."
                    value={importPassword}
                    onChange={e => setImportPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isImporting || !importFileContent}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-2 transition disabled:opacity-50 mt-4 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{isImporting ? 'Entschlüssele...' : 'Datenbank importieren'}</span>
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Demo Reset Card */}
      <section className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-700">Testdaten zurücksetzen</h4>
          <p className="text-[11px] text-slate-500">
            Setzt den Speicher auf die 42 voreingestellten Vereinsmitglieder zurück.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Demo laden</span>
        </button>
      </section>

      {/* Modals für QR-Code */}
      <QrShowModal
        isOpen={isQrShowOpen}
        onClose={() => setIsQrShowOpen(false)}
        playerCount={players.length}
      />

      <QrScanModal
        isOpen={isQrScanOpen}
        onClose={() => setIsQrScanOpen(false)}
        onSuccess={(summary) => {
          onDataChanged();
          setStatusMsg({
            type: 'success',
            text: `QR-Code erfolgreich eingelesen! ${summary.playersCount} Spieler aktualisiert${
              summary.tournamentImported ? ' (inkl. Turniereinstellungen)' : ''
            }.`
          });
        }}
      />
    </div>
  );
};
