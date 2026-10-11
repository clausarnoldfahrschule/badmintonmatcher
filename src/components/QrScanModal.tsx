import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { parseAndImportCompactQRPayload } from '../services/storage';
import { X, Camera, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

interface QrScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (summary: { playersCount: number; historyCount: number; tournamentImported: boolean }) => void;
}

export const QrScanModal: React.FC<QrScanModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Kamera starten, sobald das Modal geöffnet wird
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCameraError(null);
      setImportSuccess(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Dein Browser unterstützt keinen direkten Kamerazugriff.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.warn('Kamera konnte nicht gestartet werden:', err);
      setCameraError('Kamera-Zugriff verweigert oder nicht verfügbar. Du kannst alternativ ein Foto hochladen oder den Code einfügen.');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        handleCodeDetected(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const handleCodeDetected = (rawCode: string) => {
    try {
      setIsProcessing(true);
      const result = parseAndImportCompactQRPayload(rawCode);

      // Haptisches Feedback (kurze Vibration auf Smartphones)
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(100);
        } catch {
          // Ignorieren falls nicht unterstützt
        }
      }

      stopCamera();
      setImportSuccess(
        `Erfolgreich übertragen! ${result.playersCount} Spieler, Historie und Turniermodus wurden importiert.`
      );

      setTimeout(() => {
        onSuccess(result);
        onClose();
      }, 1400);
    } catch (err: any) {
      setIsProcessing(false);
      setCameraError(err.message || 'Ungültiger QR-Code. Bitte scanne den Code aus der Badminton Matchmaker App.');
      // Nach kurzem Fehler weiter scannen
      setTimeout(() => {
        if (isOpen) {
          animationFrameRef.current = requestAnimationFrame(tick);
        }
      }, 2000);
    }
  };

  // Foto / Screenshot aus Datei analysieren
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
          handleCodeDetected(code.data);
        } else {
          setCameraError('Auf dem ausgewählten Bild konnte kein gültiger QR-Code erkannt werden.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Manueller Text-Code
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2 text-left">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">QR-Code scannen</h3>
              <p className="text-xs text-slate-500">Daten vom Trainer-Display übernehmen</p>
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

        {/* Erfolgs-Meldung */}
        {importSuccess && (
          <div className="w-full p-4 mb-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <span>{importSuccess}</span>
          </div>
        )}

        {/* Kamera-Sucher */}
        {!importSuccess && (
          <div className="w-full relative aspect-square max-w-[270px] bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center mb-4">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Fadenkreuz & Scan-Animation */}
            <div className="absolute inset-4 border-2 border-emerald-400/80 rounded-xl pointer-events-none flex flex-col items-center justify-center">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
            </div>

            {/* Hilfetext im Sucher */}
            <div className="absolute bottom-2 text-[10px] font-semibold text-white/90 bg-black/60 px-2.5 py-0.5 rounded-full pointer-events-none backdrop-blur-xs">
              Kamera auf Trainer-Display richten
            </div>
          </div>
        )}

        {/* Fehler-Meldung */}
        {cameraError && (
          <div className="w-full p-3 mb-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-800 text-xs font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Fallbacks: Bilddatei & Text-Code */}
        {!importSuccess && (
          <div className="w-full space-y-3 pt-1 border-t border-slate-100">
            {/* Foto hochladen */}
            <div>
              <label className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs">
                <ImageIcon className="w-4 h-4 text-slate-500" />
                <span>Foto / Screenshot auswählen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Manueller Text-Code */}
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Oder Code einfügen..."
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={!manualCode.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Laden
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
