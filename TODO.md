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

## 📲 3. QR-Code Schnellübergabe (Urlaubsvertretung per Display-Scan)
**Status:** Geplant / Hohe Priorität  
**Konzept:**
- Statt eine verschlüsselte Datei per Messenger/E-Mail herunter- und hochzuladen, zeigt Trainer Siggi auf seinem Handy einfach einen **QR-Code auf dem Display**.
- Die Vertretung scannt diesen QR-Code mit der Handykamera (oder direkt in der App) ab – und hat **in 1 Sekunde den vollständigen Datenstand** (alle 42 Spieler, Stärken, Historie, Turniermodus) auf dem eigenen Gerät!
- **Technische Machbarkeit:**
  - Komprimiert (mittels gzip/deflate bzw. lz-string) schrumpft der gesamte Datenbestand von ~5 KB auf **unter 1.000 Bytes**.
  - Ein regulärer QR-Code fasst bis zu **2.953 Bytes** (Binär) bzw. **4.296 Zeichen** – die Daten passen also problemlos und fehlerkorrigiert in einen einzelnen Standard-QR-Code.
  - Optional mit kurzem 4-stelligem PIN geschützt oder direkt offline entschlüsselt.

---

## 📊 4. Historien- & Statistik-Dashboard
**Status:** Idee / Mittlere Priorität  
**Konzept:**
- **Partner-Matrix:** Visuelle Übersicht / Heatmap, wer in den letzten Wochen wie oft mit wem zusammengespielt hat.
- **Fairness-Check:** Transparente Anzeige der Bankzeiten und Einzel-Einsätze pro Spieler.
- **Erfolgsquote:** Übersicht der Satz- und Punktausbeute aus Runde 1.
