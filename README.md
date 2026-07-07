# Salesforce Deal Risk Scorer

A web dashboard that analyzes Salesforce CRM activity data for open deals, outputting real-time risk scores (0–100) with plain-English explanations and AI-generated recommended actions.

## Features

- **Deal Risk Scoring** — Weighted algorithm using activity recency, stage velocity, stakeholder engagement, and email/meeting engagement
- **AI Explanations** — Claude-powered risk summaries and targeted next actions for at-risk deals
- **Interactive Dashboard** — Color-coded deal cards (green/yellow/red) with sorting and filtering
- **Score History** — Historical risk trajectory per deal for coaching conversations
- **Onboarding Tour** — First-time user walkthrough of dashboard features
- **Salesforce OAuth** — Secure read-only CRM sync
- **Demo Mode** — Try the app without Salesforce credentials

## Tech Stack

- **Frontend:** Next.js 14, Tailwind CSS, Recharts
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (Neon)
- **Integrations:** Salesforce API (jsforce), Claude API (Anthropic)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database ([Neon](https://neon.tech) recommended)

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and fill in values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | PostgreSQL connection string |
   | `SALESFORCE_CLIENT_ID` | Salesforce Connected App client ID |
   | `SALESFORCE_CLIENT_SECRET` | Salesforce Connected App secret |
   | `SALESFORCE_CALLBACK_URL` | OAuth callback URL |
   | `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
   | `DEMO_MODE` | Set `true` to enable demo login without Salesforce |

3. **Initialize database**

   ```bash
   npm run db:push
   ```

4. **Run development server**

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

### Demo Mode

Set `DEMO_MODE=true` (default when Salesforce credentials are absent) and click **Enter Demo Mode** on the login page. This loads sample pipeline data with pre-computed risk scores and history.

### Salesforce OAuth Setup

1. Create a Connected App in Salesforce Setup
2. Enable OAuth with callback URL: `http://localhost:3000/api/auth/salesforce/callback`
3. Scopes: `api`, `refresh_token`
4. Add Client ID and Secret to `.env`

## Risk Scoring Algorithm

Scores are calculated on a 0–100 scale (higher = more at risk):

| Factor | Weight | Description |
|--------|--------|-------------|
| Activity Recency | 30% | Days since last meaningful CRM activity |
| Stage Velocity | 25% | Time in current stage vs. team norms |
| Stakeholder Engagement | 25% | Contact count, engagement frequency, coverage |
| Engagement Recency | 20% | Recent email and meeting activity |

Deals with insufficient CRM data show **Not Enough Data** status instead of a score.

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/auth/salesforce` | Initiate Salesforce OAuth |
| GET | `/api/auth/demo` | Demo mode login |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/me` | Current user |
| GET | `/api/deals` | List deals with scores |
| GET | `/api/deals/[id]` | Deal detail + history |
| POST | `/api/sync` | Sync from Salesforce |
| POST | `/api/analytics` | Track usage events |

## Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Connect Neon Postgres and run `npm run db:push`
5. Update `SALESFORCE_CALLBACK_URL` to production URL

## License

Private — All rights reserved.
