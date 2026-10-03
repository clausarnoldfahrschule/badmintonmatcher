# Badminton Matchmaker 🏸

Intelligente, mobile Trainings- und Paarungsplanung für Badminton-Hobbygruppen.

Entwickelt für Trainer und Trainingsvertretungen, um in der Sporthalle innerhalb von Sekunden ausgeglichene, abwechslungsreiche Doppel- und Einzel-Paarungen über 3 Runden zu planen – **100 % offline im Browser**, ohne Zettelwirtschaft und ohne Server-Kosten.

---

## ✨ Features (Phase 1 MVP)

- **3 Runden pro Trainingsabend mit unterschiedlicher Dramaturgie:**
  - **Runde 1 (Niveau-Gleichheit / Peer-Play):** Felder nach Spielstärke geclustert (Starke mit Starken vs. Starke, Einsteiger mit Einsteigern).
  - **Runde 2 (Lern- & Mentor-Doppel):** Jeweils ein erfahrenerer Spieler spielt mit einem schwächeren Spieler gegen ein analog zusammengestelltes Doppel.
  - **Runde 3 (Sozialer Mix):** Felderübergreifende Durchmischung (Snake-Verteilung) für maximale Abwechslung und neue Konstellationen.
- **2-Spieler-Einzel & Trainer-Challenge (1vs2):**
  - Bleiben nach Einteilung der 4er-Doppel 2 Spieler übrig, spielen diese auf einem freien Feld ein Einzel (1 gegen 1), statt auf der Bank zu sitzen.
  - **Sonderregel Anfänger:** Bleiben zwei Einsteiger (Stärke ≤ 3) übrig, tritt der Trainer alleine gegen beide an (**1 vs. 2 Trainer-Challenge**), da reine Anfänger-Einzel unüblich sind.
  - Mit automatischer Rotation über die Runden, damit nicht dieselben Spieler mehrfach Einzel spielen.
- **Trainer-Joker:**
  - Springt bei ungeraden Spielerzahlen flexibel als Springer ein, um 4er-Teams vollzumachen.
  - Physische Eindeutigkeit: Der Trainer wird garantiert niemals zeitgleich auf zwei Feldern eingeteilt.
  - Weicht bei voller Hallenbelegung zurück, damit alle Vereinsmitglieder spielen können.
- **Sitzungs-Persistenz & "Neuer Abend":**
  - Der aktive Spielplan und die Häkchen bleiben auch bei versehentlichem Browser-Reload oder Tab-Schließen erhalten.
  - Über den Button *"Neuer Abend"* kann jederzeit eine frische Sitzung gestartet werden.
- **Teilzeit-Teilnahmen & Spontanausfall-Assistent:**
  - Spieler können flexibel für einzelne Runden (Runde 1, 2 oder 3) an- oder abgemeldet werden.
  - **1-Klick-Ausfallassistent:** Verletzt sich jemand oder geht früher, werden die restlichen Runden sofort neu berechnet; bereits gespielte Runden bleiben erhalten. Die Spielerauswahl zeigt nur die in der Runde tatsächlich aktiven Personen an.
- **PWA & Offline Service Worker:**
  - Automatische Offline-Verfügbarkeit dank Service Worker Caching (`vite-plugin-pwa`). Funktioniert auch im tiefsten Funkloch moderner Stahlbeton-Sporthallen.
  - Auf dem Smartphone (iOS / Android) direkt zum Home-Bildschirm als App hinzufügbar mit individuellem App-Icon (`apple-touch-icon.png`, `badminton-shuttle.svg`).
- **DSGVO-konformer, verschlüsselter Vertretungs-Transfer:**
  - Geht der Trainer in Urlaub oder ist krank, erzeugt ein Klick auf *"Daten verschlüsselt exportieren"* eine mit **AES-GCM (256-Bit)** und Passwort geschützte Sicherungsdatei (`.enc`).
  - Diese kann bedenkenlos per Messenger an die Vertretung geschickt werden.
  - Die Vertretung öffnet die Web-App auf dem eigenen Smartphone, gibt das Passwort ein und hat sofort denselben Datenstand.

---

## 🌐 Live-App (GitHub Pages)

Die App ist live erreichbar unter:
👉 **[https://clausarnoldfahrschule.github.io/badmintonmatcher/](https://clausarnoldfahrschule.github.io/badmintonmatcher/)**

---

## 🚀 Schnellstart

### Voraussetzungen
- Node.js (v18+) und npm

### Installation & Lokaler Start
```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Entwicklungsserver starten
npm run dev
```
Anschließend die im Terminal angezeigte URL (z. B. `http://localhost:5173`) im Browser oder auf dem Smartphone öffnen.

### Automatisierte Tests ausführen
```bash
# Führt alle 23 Vitest-Unittests aus
npm run test
```

### Produktions-Build erstellen
```bash
npm run build
```
Die fertige, statische PWA-Web-App liegt im Ordner `dist/` und wird automatisch via GitHub Actions auf GitHub Pages bereitgestellt.

---

## 🧪 Architektur & Qualitätssicherung

- **Framework:** React 18 + TypeScript (strikte Typisierung ohne `any`)
- **Styling:** Tailwind CSS v4 (Touch-optimierte Bedienelemente für Einhandbedienung am Spielfeldrand)
- **Offline / PWA:** Vite PWA mit Service Worker Cache-First-Strategie und Web App Manifest
- **Kryptografie:** Web Crypto API (`SubtleCrypto` AES-GCM 256-Bit mit PBKDF2, 100.000 Iterationen)
- **Testing:** 23 automatisierte Unittests mit Vitest für mathematische Paarungsbalance, Historien-Strafen, Trainer-Joker-Eindeutigkeit, Trainer-Challenge und Speicherpersistenz.
- **Git & Deployment:** Sichere Authentifizierung via SSH-Keys und automatisches CI/CD-Deployment über GitHub Actions.
