# Badminton Matchmaker 🏸

Intelligente, mobile Trainings- und Paarungsplanung für Badminton-Hobbygruppen.

Entwickelt für Trainer und Trainingsvertretungen, um in der Sporthalle innerhalb von Sekunden ausgeglichene, abwechslungsreiche Doppel- und Einzel-Paarungen über 3 Runden zu planen – **100 % offline im Browser**, ohne Zettelwirtschaft und ohne Server-Kosten.

---

## ✨ Features (Phase 1 MVP)

- **3 Runden pro Trainingsabend mit unterschiedlicher Dramaturgie:**
  - **Runde 1 (Niveau-Gleichheit / Peer-Play):** Felder nach Spielstärke geclustert (Starke mit Starken vs. Starke, Einsteiger mit Einsteigern).
  - **Runde 2 (Lern- & Mentor-Doppel):** Jeweils ein erfahrenerer Spieler spielt mit einem schwächeren Spieler gegen ein analog zusammengestelltes Doppel.
  - **Runde 3 (Sozialer Mix):** Felderübergreifende Durchmischung (Snake-Verteilung) für maximale Abwechslung und neue Konstellationen.
- **2-Spieler-Einzel-Regel (1vs1):**
  - Bleiben nach Einteilung der 4er-Doppel 2 Spieler übrig, spielen diese auf einem freien Feld ein Einzel (1 gegen 1), statt auf der Bank zu sitzen.
  - Mit automatischer Rotation über die Runden, damit nicht dieselben Spieler mehrfach Einzel spielen.
- **Trainer-Joker:**
  - Springt bei ungeraden Spielerzahlen flexibel als Springer ein, um 4er-Teams vollzumachen.
  - Ist vom Einzel ausgeschlossen und weicht bei voller Hallenbelegung zurück, damit Vereinsmitglieder spielen.
- **Teilzeit-Teilnahmen & Spontanausfälle:**
  - Spieler können flexibel für einzelne Runden (Runde 1, 2 oder 3) an- oder abgemeldet werden.
  - **1-Klick-Ausfallassistent:** Verletzt sich jemand oder geht früher, werden die restlichen Runden sofort neu berechnet; bereits gespielte Runden bleiben erhalten.
- **DSGVO-konformer, verschlüsselter Vertretungs-Transfer:**
  - Geht der Trainer in Urlaub oder ist krank, erzeugt ein Klick auf *"Daten verschlüsselt exportieren"* eine mit **AES-GCM (256-Bit)** und Passwort geschützte Sicherungsdatei (`.enc`).
  - Diese kann bedenkenlos per WhatsApp an die Vertretung geschickt werden.
  - Die Vertretung öffnet die Web-App auf dem eigenen Smartphone, gibt das Passwort ein und hat sofort denselben Datenstand.
- **100 % Offline-First:**
  - Speichert Daten im lokalen Browser (`LocalStorage`). Funktioniert auch im Funkloch moderner Stahlbeton-Sporthallen zuverlässig.

---

## 🚀 Schnellstart

### Voraussetzungen
- Node.js (v18+) und npm

### Installation & Lokaler Start
```bash
# 1. Abhängigkeiten installieren (falls noch nicht geschehen)
npm install

# 2. Entwicklungsserver starten
npm run dev
```
Anschließend die im Terminal angezeigte URL (z. B. `http://localhost:5173`) im Browser oder auf dem Smartphone öffnen.

### Automatisierte Tests ausführen
```bash
# Führt alle 19 Vitest-Unittests aus
npm run test
```

### Produktions-Build erstellen
```bash
npm run build
```
Die fertige, statische Web-App liegt im Ordner `dist/` und kann auf jedem Webspace, Vercel oder GitHub Pages abgelegt werden.

---

## 🔗 Mit deinem Git-Konto (GitHub / GitLab) verbinden

Das Projekt ist bereits lokal als Git-Repository initialisiert und sauber nach Meilensteinen versioniert. Um es mit deinem Remote-Konto zu verknüpfen:

```bash
# 1. Neues leeres Repository auf GitHub oder GitLab erstellen (z. B. "badminton-matchmaker")

# 2. Remote-URL hinterlegen
git remote add origin https://github.com/DEIN-BENUTZERNAME/badminton-matchmaker.git

# 3. Code pushen
git push -u origin main
```

---

## 🧪 Architektur & Qualitätssicherung

- **Framework:** React 19 + TypeScript (strikte Typisierung ohne `any`)
- **Styling:** Tailwind CSS v4 (Touch-optimierte Bedienelemente für Einhandbedienung)
- **Kryptografie:** Web Crypto API (`SubtleCrypto` AES-GCM 256-Bit mit PBKDF2)
- **Testing:** 19 automatisierte Unittests mit Vitest für mathematische Paarungsbalance, Historien-Strafen, Einzel-Regel und Randfälle.
- **Code-Review:** 2-Stufen-Verfahren mit dediziertem Reviewer-Agenten zur Überprüfung von Randfällen und deutschen Quelltextkommentaren.
