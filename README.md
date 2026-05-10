# Veteranos – Football Match Organizer

A modern web app for organising your football matches with subscribers, waitlists, automatic replacements, payment tracking, and balanced team generation.

## Tech stack

- **Next.js 16** (App Router, React Server Components, Server Actions)
- **React 19** + **TypeScript**
- **Tailwind CSS v4** with a custom design system
- **Prisma 6** + **PostgreSQL**
- **Custom auth** (bcryptjs + jose JWT cookies)
- **Zod** for validation
- **lucide-react** icons
- Deployment target: **Railway**

## Features

### Player view
- Overview of all upcoming matches with date, time, and location
- Per match: confirmed players, declines, waitlist, **replacement assignment**
- **Payment status** between the stepping-in waitlist player and the absent subscriber
- PayPal link / name on subscriber profiles for one-click payment
- Personal profile page with PayPal info and password change
- Two player types:
  - **Subscriber**: fixed slot, confirms or declines per match
  - **Waitlist player**: opts into individual matches via the waitlist

### Auto-replacement logic
Strict order: waitlist player 1 replaces the first declined subscriber, waitlist player 2 the second, and so on. On every change the payment status of currently-active replacements is automatically set to `PENDING` (or reset to `NONE` if they no longer step in).

### Admin area
- Create, edit, delete players
- Skills (0–100): overall, technique, speed, stamina, defense, offense, passing, shooting, goalkeeping + preferred position
- Create, edit, **lock**, delete matches
- Manually add or remove players from a match
- Toggle payment status with a click (`pending` ↔ `paid`)
- **Generate teams** (2, 3 or 4 teams) using snake-draft + local swap optimisation
- Fair distribution based on skills, position, and goalkeeper spread
- Team showcase with strength stats and short, punchy commentary per team

## Local development

### Prerequisites
- Node.js 20+
- PostgreSQL (locally or via Docker)

### Steps

```bash
git clone https://github.com/andershow88/veteranos.git
cd veteranos
npm install

# Prepare .env
cp .env.example .env
# Set DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD.
# Generate AUTH_SECRET: openssl rand -base64 32

# Apply schema
npx prisma migrate dev --name init

# Create admin (optionally with demo data)
npm run db:seed
# or with demo players + a demo match:
SEED_DEMO_PLAYERS=true npm run db:seed

# Start the dev server
npm run dev
```

Then open http://localhost:3000.

## Railway deployment

1. **Create a Railway project** and add a PostgreSQL plugin → `DATABASE_URL` is provided automatically.
2. **Connect the repository** (`andershow88/veteranos`).
3. **Set environment variables** on the Railway service:
   - `AUTH_SECRET` (generate via `openssl rand -base64 32`)
   - `ADMIN_EMAIL` and `ADMIN_PASSWORD` (for the initial admin)
4. **Deploy.** Railway uses `railway.json`:
   - **Build:** `npm ci && npx prisma generate && npm run build`
   - **Start:** `npx prisma migrate deploy && npm run start`
5. Once, in the Railway shell: `npm run db:seed` to create the admin account.

`/api/health` returns JSON as soon as the database is reachable.

## Project structure

```
src/
├─ app/                  # App Router pages
│  ├─ page.tsx           # Homepage = match overview
│  ├─ matches/[id]       # Match detail (incl. team showcase)
│  ├─ login, register    # Auth
│  ├─ profile            # Player profile
│  ├─ admin/             # Admin area
│  └─ api/health         # Health check for Railway
├─ components/
│  ├─ ui/                # Button, Card, Input, Avatar, Badge
│  ├─ match/             # MatchCard, SignupControls, ReplacementRow
│  ├─ admin/             # PlayerForm, MatchForm, SignupManager, TeamControls
│  └─ team/              # TeamShowcase
├─ lib/
│  ├─ auth.ts            # Sessions, hashing, guards
│  ├─ db.ts              # Prisma client
│  └─ utils.ts           # cn, date helpers
└─ server/
   ├─ auth-actions.ts    # login/register/logout
   ├─ match-actions.ts   # confirm/decline, waitlist, replacement logic
   ├─ match-queries.ts   # buildMatchView with replacement assignment
   ├─ admin-actions.ts   # player/match CRUD, team generation
   ├─ profile-actions.ts # profile editing
   └─ team-generator.ts  # snake-draft + local swap optimisation
prisma/
├─ schema.prisma
└─ seed.ts
```

## API for a future mobile app

Server Actions encapsulate the entire business logic (replacement algorithm, team generator). For a future mobile app (Expo / React Native), the modules in `src/server/*` can be reused directly to back REST/JSON endpoints under `src/app/api/*` — the data models and logic are UI-free.

## License

Private — Veteranos.
