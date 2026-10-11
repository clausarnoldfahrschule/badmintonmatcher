# To-Do & Feature-Roadmap 🏸

Diese Roadmap dokumentiert angedachte und geplante Erweiterungen für den **Badminton Matchmaker**. Sie wird fortlaufend gepflegt und priorisiert.

---

## ✅ 1. Turniermodus (Turniervorbereitung)
**Status:** Vollständig umgesetzt & aktiv 🏆  
**Umsetzung:**
- **Zwei Turniermodi:**
  1. **Doppel- & Mixed-Turnier:** Feste Paarungen trainieren gezielt zusammen. Mehrfachmeldungen (Überschneidungen) werden automatisch intelligent über Runden verteilt (z. B. Claus mit Simone in R1 und Claus mit Nico in R2/R3).
  2. **Schleifchenturnier:** Gemeldete Spieler erhalten an jedem Trainingsabend 2 fordernde Spiele gegen ebenbürtige oder stärkere Gegner.
- **Automatische Deaktivierung:** Nach Ablauf des eingetragenen Turnierdatums schaltet sich der Modus automatisch ab.
- **Optische Kennzeichnung:** Spielfelder mit Turnierspielen tragen ein goldenes `🏆 Turnier`-Badge.
- **Datensicherung:** Die Turnierkonfiguration wird verschlüsselt im Backup-Transfer mitgesichert.

---

## ✅ 2. Lautlose Feinanpassung & Stufenwechsel-Vorschlag (Schwellenwert $\pm 0{,}8$)
**Status:** Vollständig umgesetzt & aktiv  
**Umsetzung:**
- Sanfte Nuancen ($\pm 0{,}3$) laufen vollautomatisch im Hintergrund ohne Trainer-Zwischenfragen.
- Erst ab Erreichen der Schwelle von $\pm 0{,}8$ (z. B. $+0{,}9$) wird der Trainer im Dialog gefragt, ob der Spieler eine Stufe auf- oder absteigen soll.
- Bei Bestätigung wird der Basiswert angepasst (z. B. 6 ➔ 7) und der Zusatzwert auf $0{,}0$ zurückgesetzt.

---

## ✅ 3. QR-Code Schnellübergabe (Urlaubsvertretung per Display-Scan)
**Status:** Vollständig umgesetzt & aktiv 📲  
**Umsetzung:**
- Statt einer Datei zeigt der Trainer auf seinem Handy einfach einen **QR-Code auf dem Display**.
- Die Vertretung scannt diesen Code direkt in der App per Smartphone-Kamera ab (inkl. Vibrationsfeedback bei Erkennung) oder wählt alternativ ein Foto/Screenshot aus.
- **Effiziente Komprimierung:** Mittels optimierter Tuple-Kompression und `lz-string` Base64-Kodierung umfasst der gesamte Datenbestand aller 42 Vereinsmitglieder (inkl. Formwerten, Historie und Turniermodus) nur **~800 Zeichen** und scannt sich in Millisekunden.
- 100% offline & lokal – keine Serverübertragung.

---

## 📊 4. Historien- & Statistik-Dashboard
**Status:** Idee / Mittlere Priorität  
**Konzept:**
- **Partner-Matrix:** Visuelle Übersicht / Heatmap, wer in den letzten Wochen wie oft mit wem zusammengespielt hat.
- **Fairness-Check:** Transparente Anzeige der Bankzeiten und Einzel-Einsätze pro Spieler.
- **Erfolgsquote:** Übersicht der Satz- und Punktausbeute aus Runde 1.
