# To-Do & Feature-Roadmap 🏸

Diese Roadmap dokumentiert angedachte und geplante Erweiterungen für den **Badminton Matchmaker**. Sie wird fortlaufend gepflegt und priorisiert.

---

## 🏆 1. Turniermodus (Turniervorbereitung)
**Status:** Geplant / Hohe Priorität  
**Konzept:**
- Kurz vor offiziellen Turnieren oder Meisterschaften sollen gemeldete Doppelpaare („Turnierpaare“) gezielt miteinander trainieren können.
- **Funktionsweise:**
  - Im Trainingsbereich können feste Doppelpaare für den Abend definiert oder markiert werden.
  - Die Paarungs-Engine hebt für diese Paare die Trennungs- und Wiederholungsregeln auf: Sie spielen alle Runden zusammen als festes Team.
  - Gegner-Zuweisung: Die Engine lost gezielt gleich starke oder bewusst stärkere Doppel als Gegner zu, um Matchpraxis und Wettkampfhärte zu trainieren.

---

## ✅ 2. Lautlose Feinanpassung & Stufenwechsel-Vorschlag (Schwellenwert $\pm 0{,}8$)
**Status:** Vollständig umgesetzt & aktiv  
**Umsetzung:**
- Sanfte Nuancen ($\pm 0{,}3$) laufen vollautomatisch im Hintergrund ohne Trainer-Zwischenfragen.
- Erst ab Erreichen der Schwelle von $\pm 0{,}8$ (z. B. $+0{,}9$) wird der Trainer im Dialog gefragt, ob der Spieler eine Stufe auf- oder absteigen soll.
- Bei Bestätigung wird der Basiswert angepasst (z. B. 6 ➔ 7) und der Zusatzwert auf $0{,}0$ zurückgesetzt.

---

## ⏱️ 3. Hallen-Timer & Akustisches Wechselsignal
**Status:** Idee / Mittlere Priorität  
**Konzept:**
- Ein integrierter Rundentimer (z. B. 15, 20 oder 25 Minuten pro Spielrunde).
- Große, aus der Ferne ablesbare Zeitanzeige für das am Hallenrand abgelegte Smartphone/Tablet.
- Akustisches Signal (Gong / Signalton) am Ende der Runde, um den Spielfeldwechsel in der Halle einzuläuten.

---

## 📊 4. Historien- & Statistik-Dashboard
**Status:** Idee / Mittlere Priorität  
**Konzept:**
- **Partner-Matrix:** Visuelle Übersicht / Heatmap, wer in den letzten Wochen wie oft mit wem zusammengespielt hat.
- **Fairness-Check:** Transparente Anzeige der Bankzeiten und Einzel-Einsätze pro Spieler.
- **Erfolgsquote:** Übersicht der Satz- und Punktausbeute aus Runde 1.

---

## 🏟️ 5. Hallen- & Feld-Konfigurator
**Status:** Idee / Optionale Erweiterung  
**Konzept:**
- Individuelle Feldbezeichnungen (z. B. „Feld 1 (Fenster)“, „Feld 2 (Tribüne)“).
- Temporäres Sperren einzelner Felder (z. B. defektes Netz oder Hallenteilung durch andere Sportart).
- Automatische Anpassung der maximalen Feldanzahl an die Hallengröße.

---

## 📲 6. QR-Code Schnellübergabe
**Status:** Idee / Zukünftig  
**Konzept:**
- Schnelle Übergabe des aktuellen Abends an das Smartphone eines Spielers oder einer Vertretung via QR-Code-Scan auf dem Display, ohne Dateidownload.
