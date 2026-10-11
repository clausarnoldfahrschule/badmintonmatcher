# Handbuch: Badminton Matchmaker 🏸

Willkommen beim offiziellen Handbuch für den **Badminton Matchmaker**. Dieses Dokument dient Trainern, Übungsleitern und Vertretungen als Leitfaden für die Nutzung, Pflege und Administration der App am Spielfeldrand und zu Hause.

---

## Inhaltsverzeichnis
1. [Philosophie & Grundkonzept](#1-philosophie--grundkonzept)
2. [Ablauf eines Trainingsabends](#2-ablauf-eines-trainingsabends)
3. [Die drei Rundenmodi im Detail](#3-die-drei-rundemodi-im-detail)
4. [Sonderregeln: Trainer-Joker & Einzel](#4-sonderregeln-trainer-joker--einzel)
5. [Gastspieler-Modus ("Gäste")](#5-gastspieler-modus-gäste)
6. [Ergebniserfassung & Selbsteinstufungssystem](#6-ergebniserfassung--selbsteinstufungssystem)
7. [Spieler-Stammdaten & Spielstärken](#7-spieler-stammdaten--spielstärken)
8. [Datensicherung, Verschlüsselung & Vertretung](#8-datensicherung-verschlüsselung--vertretung)
9. [Offline-Nutzung & Installation als App (PWA)](#9-offline-nutzung--installation-als-app-pwa)

---

## 1. Philosophie & Grundkonzept

Der **Badminton Matchmaker** löst die typischen Probleme von Badminton-Hobbyspielabenden:
- **Ausgeglichene Partien:** Niemand soll sich langweilen oder hoffnungslos überfordert sein.
- **Hohe soziale Durchmischung:** Über die Wochen spielen möglichst viele Vereinsmitglieder miteinander und gegeneinander.
- **Spielfluss ohne Leerlauf:** Bankdrücken wird durch Springer- und Einzel-Regeln minimiert.
- **100 % lokal & offline:** Keine Server, kein Login, keine Cloud-Abhängigkeit – Daten verbleiben auf dem Smartphone des Trainers.

---

## 2. Ablauf eines Trainingsabends

### Schritt 1: Anwesenheit erfassen (Check-In)
1. Im Tab **„Trainingsabend“** die Anwesenheit der Spieler prüfen.
2. Über die Buttons **„Alle an“** oder **„Alle aus“** den Grundzustand setzen.
3. Einzelne Spieler an- oder abwählen.
4. **Teilzeit-Spieler:** Kommt ein Spieler erst später (z. B. ab Runde 2) oder geht früher (z. B. nach Runde 2), können die Buttons `R1`, `R2`, `R3` gezielt aktiviert oder deaktiviert werden.
5. **Gäste anmelden:** Falls Neuzugänge oder Freunde dabei sind, über `+ Gast anmelden` erfassen (siehe [Kapitel 5](#5-gastspieler-modus-gäste)).

### Schritt 2: Spielplan berechnen
- Auf den grünen Button **„🏸 Spielplan für heute berechnen“** tippen.
- Der Algorithmus berechnet in Sekundenbruchteilen die optimale Aufteilung aller 3 Runden unter Berücksichtigung der Stärken und der Historie der letzten Wochen.

### Schritt 3: Der Abend läuft
- Oben im Spielplan zwischen den Reitern **„Runde 1“**, **„Runde 2“** und **„Runde 3“** wechseln.
- Die Spieler rufen ihre Felder auf und spielen.

### Schritt 4: Spontanausfall / Verletzung behandeln
- Verletzt sich ein Spieler oder muss spontan gehen:
  1. Den roten Button **„Spontanausfall melden“** anklicken.
  2. Den betroffenen Spieler auswählen und angeben, ab welcher Runde er ausfällt.
  3. Die App berechnet die verbleibenden Runden blitzschnell neu, während bereits gespielte Runden unberührt bleiben.

### Schritt 5: Abend abschließen & in Historie sichern
- Am Ende des Trainings auf **„Abend abschließen & in Historie sichern“** klicken.
- Dies speichert die heutigen Spielpaarungen, damit sie nächste Woche bei der Berechnung vermieden werden.
- Wurden in Runde 1 Ergebnisse eingegeben, prüft das System automatisch, ob Stärke-Korrekturen vorgeschlagen werden sollen.
- Für den nächsten Abend auf **„Neuer Abend“** klicken (hierbei können temporäre Gäste mit einem Klick entfernt werden).

---

## 3. Die drei Rundenmodi im Detail

Ein Spielabend besteht standardmäßig aus drei Runden mit unterschiedlicher Dramaturgie:

| Runde | Modus | Ziel & Funktionsweise |
|---|---|---|
| **Runde 1** | **Niveau-Gleichheit (Peer-Play)** | Homogene Felder. Spieler ähnlicher Stärke spielen miteinander und gegeneinander (z. B. Feld 1: Level 7-8, Feld 2: Level 5-6, Feld 3: Level 3-4). Ideal zum Einspielen und als Basis für Leistungsmessung. |
| **Runde 2** | **Lern- & Mentor-Doppel** | Auf jedem Feld spielt je ein stärkerer Spieler mit einem schwächeren Spieler als Team gegen ein analog zusammengestelltes Doppel. Fördert Teamgeist und Weiterentwicklung. |
| **Runde 3** | **Sozialer Mix** | Felderübergreifender Schlangen-Mix (Snake-Verteilung) für maximale Durchmischung und abwechslungsreiche Begegnungen zum Ausklang. |

---

## 4. Sonderregeln: Trainer-Joker & Einzel

### Trainer als Joker / Springer
- Ist die Spielerzahl ungerade (z. B. 11 oder 13 Spieler), springt der Trainer als Joker ein, um ein 4er-Doppel zu komplettieren.
- Der Trainer kann im Anwesenheitsbereich aktiviert/deaktiviert und seine Spielstärke (Standard: 7) konfiguriert werden.
- **Garantie:** Der Trainer wird niemals physisch zeitgleich auf zwei Feldern eingeteilt. Bei voller Hallenbelegung weicht der Trainer zurück, damit Mitglieder Vorrang haben.

### 2-Spieler-Restregel (Einzel & Trainer-Challenge)
- Bleiben nach Einteilung aller 4er-Doppel genau 2 Spieler übrig (z. B. 10 Spieler = zwei Doppel + 2 übrig):
  - **Reguläres Einzel (1 vs. 1):** Die beiden verbleibenden Spieler spielen ein Einzel gegeneinander auf einem freien Feld. Die App rotiert über die Runden, sodass nicht dieselben Spieler mehrfach Einzel spielen.
  - **Trainer-Challenge (1 vs. 2):** Sind die beiden verbleibenden Spieler reine Anfänger (Stärke ≤ 3), spielt der Trainer alleine gegen beide (1 vs. 2), da Anfänger-Einzel unüblich sind und Frust erzeugen würden.

---

## 5. Gastspieler-Modus ("Gäste")

Für Schnuppertrainings, Freunde von Vereinsmitgliedern und spontane Gäste:

1. **Gast anlegen:**
   - Klick auf `+ Gast anmelden` im Trainingsbereich.
   - Name eingeben und grobe Spielstärke (1–10) schätzen.
   - **Einladenden Spieler (Host)** auswählen oder `— Ohne Einladung / Alleine da —` wählen.
2. **Freundschafts-Bonus:**
   - Ein Gast möchte meist mit seinem einladenden Freund spielen. In Runde 2 und 3 erhalten Gast und Freund einen starken Paarungs-Bonus, sodass sie bevorzugt auf demselben Feld spielen.
   - In Runde 1 spielen sie zusammen auf einem Feld, wenn ihr Stärkeunterschied moderat ist ($\le 2.0$). Ist der Unterschied extrem groß (z. B. Liga vs. Anfänger), bleibt Runde 1 getrennt, und sie spielen in R2/R3 garantiert zusammen.
3. **100 % Wertungsschutz:**
   - Matches mit Gastspielern werden niemals für Stärkekorrekturen ausgewertet, selbst wenn Punkte erfasst werden.
4. **Übernahme als Vereinsmitglied:**
   - Gefällt es dem Gast und tritt er dem Verein bei, kann er in der Spieler-Verwaltung mit einem Klick auf das `UserPlus`-Icon direkt als reguläres Mitglied übernommen werden.

---

## 6. Ergebniserfassung & Selbsteinstufungssystem

Die Erfassung von Spielergebnissen ist **vollständig optional**.

### Auswertungs-Kriterien
- Nur Spiele aus **Runde 1 (Niveau-Gleichheit)** fließen in die Wertung ein (in R2 und R3 sind Paarungen zu heterogen).
- Runden mit Trainer-Joker oder Gastspielern werden komplett ignoriert.
- Gespielt werden 2 Gewinnsätze. Die Punktedifferenz beider Sätze bestimmt das Ergebnis:
  - **Differenz < 10 Punkte:** Spiel war ausgeglichen (Signal = 0).
  - **Differenz 10–20 Punkte:** Mäßiges Übergewicht (Signal = ±1).
  - **Differenz > 20 Punkte:** Starkes Übergewicht (Signal = ±2).
- **Überraschungssignal:** Die errechnete Stärkedifferenz vor dem Spiel wird mit dem tatsächlichen Ausgang verrechnet. Ein erwarteter Favoritensieg wird gedämpft; ein Underdog-Sieg liefert ein starkes Signal.

### Der Zusatzwert (`skillAdjustment`, max. ±1.5) & Stufenwechsel
- **Lautlose Feinanpassung im Hintergrund:**
  - Erreicht ein Spieler über mehrere R1-Matches mit verschiedenen Partnern ein klares Überraschungssignal, wird sein Zusatzwert (`skillAdjustment`) im Hintergrund sanft um $\pm 0{,}3$ angepasst.
  - Der Trainer wird hierbei **nicht** mit ständigen Zwischenfragen oder Popups belastet. Die Paarungs-Engine arbeitet im Hintergrund bereits mit der optimierten effektiven Stärke.
- **Rückfrage nur bei echtem Stufenwechsel (Schwelle $\pm 0{,}8$):**
  - Spielt ein Spieler über Wochen so konstant stark, dass sein Zusatzwert $\ge +0{,}8$ erreicht, poppt das Banner **„Vorschlag zum Stufenwechsel“** auf:
    *„Max M. von Stufe 6 auf Stufe 7 befördern?“*
  - Umgekehrt bei konstanter Unterforderung ($\le -0{,}8$): Vorschlag zur Anpassung (z. B. 5 auf 4).
- **Entscheidung durch den Trainer:**
  - **Befördern / Anpassen:** Der Basiswert steigt/sinkt um 1 Stufe, der Zusatzwert wird sauber auf $0{,}0$ zurückgesetzt und der Spieler hat wieder den vollen Entwicklungsspielraum.
  - **Belassen:** Der Trainer lehnt ab. Der Zusatzwert wird gedämpft (unter 0.8), sodass der Trainer am nächsten Abend nicht sofort wieder gefragt wird.
  - Über das Zurücksetzen-Icon (`RotateCcw`) in den Stammdaten kann der Zusatzwert jederzeit auf $0{,}0$ zurückgesetzt werden.

---

## 7. Spieler-Stammdaten & Spielstärken

Im Tab **„Spieler“** werden alle Mitglieder verwaltet:
- **Basis-Spielstärke (1 bis 10):**
  - 1–3: Einsteiger / Anfänger
  - 4–6: Solider Hobbyspieler
  - 7–8: Stark / Ambitioniert
  - 9–10: Liga / Top-Spieler
- **Status:** Aktiv oder Pausierend (z. B. bei längerer Verletzung).
- **Zusatzwert einsehen & zurücksetzen:**
  - Hat ein Spieler einen aktiven Zusatzwert, wird dieser angezeigt (z. B. `Stärke 6 (+0.3)`).
  - Über das Zurücksetzen-Symbol (`RotateCcw`) kann die Feinanpassung jederzeit auf den reinen Trainer-Basiswert zurückgesetzt werden.

---

## 8. Datensicherung, Verschlüsselung & Vertretung

Alle Daten liegen im lokalen Speicher des Browsers (`localStorage`).

### Verschlüsselter Vertretungs-Transfer (DSGVO-konform)
1. Im Tab **„Datensicherung“** auf **„Daten verschlüsselt exportieren“** klicken.
2. Ein sicheres Übergabe-Passwort vergeben.
3. Die heruntergeladene Datei (`badminton-backup-....enc`) ist per **AES-GCM (256-Bit, PBKDF2 mit 100.000 Iterationen)** militärsicher verschlüsselt.
4. Datei per WhatsApp, Signal oder E-Mail an die Vertretung schicken und das Passwort separat mitteilen.
5. Die Vertretung öffnet die Web-App, wählt **„Backup importieren“**, gibt das Passwort ein und arbeitet mit dem exakten Datenstand weiter.

---

## 9. Offline-Nutzung & Installation als App (PWA)

Die Web-App ist eine vollwertige **Progressive Web App (PWA)**:
- **Offline:** Alle Funktionen laufen ohne Internetverbindung in Sporthallen.
- **Als App auf dem Handy installieren:**
  - **iOS (Safari):** Teilen-Button antippen ➔ *„Zum Home-Bildschirm“*.
  - **Android (Chrome):** Menü (Drei Punkte) ➔ *„App installieren“* oder *„Zum Startbildschirm hinzufügen“*.

### Automatische Updates & Versionierung
- **Kryptografische Dateiprüfung:** Bei jedem Build erhält jede Datei eine neue Revisions-Prüfsumme. Der Service Worker prüft bei bestehender Internetverbindung im Hintergrund, ob eine neue Version auf dem Server liegt.
- **Automatischer Check bei App-Öffnung:** Sobald die App auf dem Smartphone geöffnet oder aus dem Ruhezustand geholt wird (`visibilitychange`), wird online nach Updates gesucht.
- **Update-Banner:** Steht eine neue Version bereit, erscheint oben am Bildschirm ein grünes Banner:  
  **„Neue App-Version online verfügbar! [Jetzt aktualisieren]“**.  
  Ein Fingertipp lädt die App blitzschnell mit dem neuesten Code neu.
- **Manueller Check:** Ganz unten im Footer gibt es den Button **„Nach Updates suchen“**, mit dem man die Prüfung sofort manuell anstoßen kann.
- **Tipp für iOS (iPhone):** Falls Safari eine alte Version im Zwischenspeicher festhält: Die App im iOS-App-Switcher (Geste von unten nach oben) einmal komplett nach oben wegwischen und neu vom Startbildschirm öffnen.
