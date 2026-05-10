# Veteranos – Fußballtermine organisieren

Eine moderne Web-App für die Organisation eurer Fußballtermine mit Abo-Spielern, Wartelisten, automatischem Nachrücken, Bezahlung-Tracking und automatischer Team-Generierung.

## Tech-Stack

- **Next.js 16** (App Router, React Server Components, Server Actions)
- **React 19** + **TypeScript**
- **Tailwind CSS v4** mit Custom-Design-System
- **Prisma 6** + **PostgreSQL**
- **Custom Auth** (bcryptjs + jose JWT cookies)
- **Zod** für Validierung
- **lucide-react** Icons
- Deployment-Ziel: **Railway**

## Features

### Spieler-Sicht
- Übersicht aller anstehenden Termine mit Datum, Uhrzeit, Ort
- Pro Termin: Teilnehmer, Absagen, Warteliste, **Nachrücker-Zuordnung**
- **Zahlungsstatus** zwischen nachrückendem Wartelisten- und absagendem Abo-Spieler
- PayPal-Link / -Name des Abo-Spielers für direktes Bezahlen
- Eigenes Profil mit PayPal-Daten und Passwort-Wechsel
- Zwei Spieler-Typen:
  - **Abo-Spieler**: fester Platz, sagt pro Termin zu/ab
  - **Wartelisten-Spieler**: tragen sich pro Termin auf die Warteliste ein

### Auto-Nachrück-Logik
Strikte Reihenfolge: Wartelisten-Spieler 1 ersetzt den ersten abgesagten Abo-Spieler, Wartelisten-Spieler 2 den zweiten, usw. Bei jeder Änderung wird der Zahlungsstatus für die jeweils aktiven Nachrücker automatisch auf `PENDING` gesetzt (oder zurück auf `NONE`, falls der Wartelisten-Spieler nicht mehr nachrückt).

### Admin-Bereich
- Spieler anlegen, bearbeiten, löschen
- Skills (0–100): Gesamtstärke, Technik, Geschwindigkeit, Ausdauer, Defensive, Offensive, Passspiel, Schuss, Torwart, plus Position
- Termine anlegen, bearbeiten, **sperren**, löschen
- Spieler manuell zu Termin hinzufügen/entfernen
- Zahlungsstatus durch Klick durchschalten (`offen` ↔ `bezahlt`)
- **Teams generieren** (2, 3 oder 4 Teams) mit Snake-Draft + lokaler Tausch-Optimierung
- Faire Verteilung anhand Skills, Position und Torhüter-Verteilung
- Team-Übersicht mit Stärke-Stats und automatischen, fußballtypischen Kommentaren

## Lokale Entwicklung

### Voraussetzungen
- Node.js 20+
- PostgreSQL (lokal oder Docker)

### Schritte

```bash
git clone https://github.com/andershow88/veteranos.git
cd veteranos
npm install

# .env vorbereiten
cp .env.example .env
# DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL und ADMIN_PASSWORD setzen.
# AUTH_SECRET generieren: openssl rand -base64 32

# Datenbank-Schema anlegen
npx prisma migrate dev --name init

# Admin anlegen (optional mit Demo-Daten)
npm run db:seed
# oder mit Demo-Spielern:
SEED_DEMO_PLAYERS=true npm run db:seed

# Dev-Server starten
npm run dev
```

Dann http://localhost:3000 öffnen.

## Railway Deployment

1. **Railway-Projekt erstellen** und ein PostgreSQL-Plugin hinzufügen → `DATABASE_URL` wird automatisch bereitgestellt.
2. **Repository verbinden** (`andershow88/veteranos`).
3. **Environment-Variablen** im Railway-Service setzen:
   - `AUTH_SECRET` (mit `openssl rand -base64 32` generieren)
   - `ADMIN_EMAIL` und `ADMIN_PASSWORD` (für initialen Admin)
4. **Deployen.** Railway nutzt `railway.json`:
   - **Build:** `npm ci && npx prisma generate && npm run build`
   - **Start:** `npx prisma migrate deploy && npm run start`
5. Einmalig den Admin anlegen via Railway Shell: `npm run db:seed`.

`/api/health` antwortet mit JSON, sobald DB erreichbar ist.

## Projektstruktur

```
src/
├─ app/                  # App Router Pages
│  ├─ page.tsx           # Homepage = Termin-Übersicht
│  ├─ matches/[id]       # Termin-Detail (inkl. Team-Übersicht)
│  ├─ login, register    # Auth
│  ├─ profile            # Spielerprofil
│  ├─ admin/             # Adminbereich
│  └─ api/health         # Health-Check für Railway
├─ components/
│  ├─ ui/                # Button, Card, Input, Avatar, Badge
│  ├─ match/             # MatchCard, SignupControls, ReplacementRow
│  ├─ admin/             # PlayerForm, MatchForm, SignupManager, TeamControls
│  └─ team/              # TeamShowcase
├─ lib/
│  ├─ auth.ts            # Sessions, Hashing, Guards
│  ├─ db.ts              # Prisma Client
│  └─ utils.ts           # cn, Datums-Helpers
└─ server/
   ├─ auth-actions.ts    # login/register/logout
   ├─ match-actions.ts   # zu-/absagen, Warteliste, Nachrücker-Logik
   ├─ match-queries.ts   # buildMatchView mit Replacement-Berechnung
   ├─ admin-actions.ts   # Spieler/Match-CRUD, Teams generieren
   ├─ profile-actions.ts # Profilpflege
   └─ team-generator.ts  # Snake-Draft + Tausch-Optimierung
prisma/
├─ schema.prisma
└─ seed.ts
```

## API für spätere Mobile-App

Server Actions kapseln die gesamte Geschäftslogik (Nachrück-Algorithmus, Team-Generator). Für eine spätere Mobile-App (Expo / React Native) lassen sich die Module in `src/server/*` direkt als Basis für REST-/JSON-Endpunkte unter `src/app/api/*` wiederverwenden – die Datenmodelle und Logik sind UI-frei.

## Lizenz

Privat – Veteranos.
