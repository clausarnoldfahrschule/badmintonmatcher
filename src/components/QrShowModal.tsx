import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generateCompactQRPayload } from '../services/storage';
import { X, QrCode, Copy, Check, Users, ShieldCheck } from 'lucide-react';

interface QrShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCount: number;
}

export const QrShowModal: React.FC<QrShowModalProps> = ({ isOpen, onClose, playerCount }) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  let qrPayload = '';
  try {
    qrPayload = generateCompactQRPayload();
  } catch (err) {
    console.error('Fehler bei QR-Generierung:', err);
  }

  const handleCopy = () => {
    if (!qrPayload) return;
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center text-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2 text-left">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">QR-Code Übergabe</h3>
              <p className="text-xs text-slate-500">Für deine Urlaubsvertretung</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Canvas Box */}
        <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-inner flex items-center justify-center mb-4 w-full aspect-square max-w-[270px]">
          {qrPayload ? (
            <QRCodeSVG
              value={qrPayload}
              size={238}
              level="M"
              includeMargin={true}
              className="w-full h-full"
            />
          ) : (
            <div className="text-xs text-rose-500">Fehler beim Erzeugen des QR-Codes.</div>
          )}
        </div>

        {/* Kurzanleitung */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 w-full mb-4 text-left">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-950 leading-relaxed font-medium">
              Deine Urlaubsvertretung öffnet die Badminton-App, tippt auf <strong>„QR-Code scannen“</strong> und hält die Kamera auf dein Display.
            </p>
          </div>
        </div>

        {/* Metadaten */}
        <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            {playerCount} Spieler
          </span>
          <span>•</span>
          <span>Größe: ~{Math.round(qrPayload.length)} Zeichen</span>
        </div>

        {/* Copy Button & Schließen */}
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Code in Zwischenablage kopiert!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Text-Code kopieren (Fallback)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            Fertig / Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
