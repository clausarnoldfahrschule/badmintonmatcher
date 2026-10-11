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

## 📈 2. Automatische Basiswert-Beförderung (Schwellenwert $\ge$ 0,8)
**Status:** Konzeptioniert / Diskutiert  
**Konzept:**
- Aktuell sammelt das System Feinanpassungen (`skillAdjustment`) im Bereich von $-1{,}5$ bis $+1{,}5$ bezogen auf den Trainer-Basiswert.
- **Idee:** Wenn ein Spieler über mehrere Wochen so konstant stark (oder schwach) spielt, dass sein Zusatzwert einen Schwellenwert von z. B. **$+0{,}8$** (oder $-0{,}8$) erreicht, schlägt die App dem Trainer eine dauerhafte Anpassung des Basiswerts vor:
  - *Vorschlag im Dialog:* „Max M. spielt konstant über seinem Niveau. Basiswert von 6 auf **7** anheben und Feinanpassung auf **0,0** zurücksetzen?“
- **Vorteile:**
  - Saubere, ganzzahlige Basis-Level in der Mitgliederliste.
  - Der Spieler erhält wieder den vollen Spielraum von $\pm 1{,}5$ für künftige Entwicklungen.
  - Der Trainer behält mit 1-Klick-Freigabe die volle Kontrolle.

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
