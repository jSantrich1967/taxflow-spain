# TaxFlow Spain

**AI-assisted Spanish tax workflow automation for Modelo 030, Modelo 036, VAT and ROI compliance.**

TaxFlow Spain is an internal workflow platform that helps tax analysts process foreign directors and foreign companies requiring Spanish tax identification and VAT-related workflows. OpenAI extracts structured data from emails, CRM records, and documents; deterministic rules classify cases; analysts review and approve before any official action.

> **Compliance:** The AI never makes final legal/tax decisions, never submits official forms automatically, and never files with AEAT without human approval.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS, React Hook Form, Zod |
| Backend | Next.js API Routes / Server Actions, Node.js |
| Database | Prisma ORM — SQLite (MVP) → PostgreSQL / Supabase (production) |
| AI | OpenAI API (server-side only, Structured Outputs) |
| Storage | Local `/uploads` (MVP) → Supabase / Drive / SharePoint |

---

## Prerequisites

- Node.js 20+
- npm 10+
- OpenAI API key (for Phase 2 AI extraction)

---

## Quick Start

```bash
# 1. Clone / enter project
cd taxflow-spain

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set OPENAI_API_KEY when ready for AI features

# 4. Initialize database
npm run db:migrate
npm run db:seed

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/login`.

**Demo users** (after `db:seed`):

| Email | Password | Role |
|-------|----------|------|
| `admin@taxflow.local` | `Admin123!` | ADMIN |
| `supervisor@taxflow.local` | `Supervisor123!` | SUPERVISOR |
| `analyst@taxflow.local` | `Analyst123!` | ANALYST |

To skip login during local development, set `AUTH_DISABLED=true` in `.env`.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite: `file:./dev.db` or PostgreSQL connection string |
| `AUTH_SECRET` | Session signing secret (required when auth enabled) |
| `AUTH_DISABLED` | Set `true` to bypass login in local dev |
| `OPENAI_API_KEY` | OpenAI API key (server-side only) |
| `OPENAI_MODEL` | Model name, default `gpt-4o` |
| `STORAGE_PROVIDER` | `local` (default) or `supabase` (placeholder) |
| `UPLOAD_DIR` | Local upload directory, default `./uploads` |
| `MAX_UPLOAD_SIZE_MB` | Max upload size in MB |
| `WEBHOOK_SECRET` | Secret for `/api/webhooks/ingest` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Gmail OAuth (admin `/integrations`) |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot Private App token (optional if saved in DB) |
| `CRON_SECRET` | Bearer token for `/api/cron/sync-integrations` |
| `GMAIL_SYNC_QUERY` | Gmail search query (default `is:unread newer_than:7d`) |
| `AUTO_EXTRACT_ON_INGEST` | Run AI after ingest (`true` unless set to `false`) |
| `DATA_RETENTION_DAYS` | GDPR retention window (default 2555 days) |

---

## Project Structure

```
taxflow-spain/
├── prisma/
│   ├── schema.prisma          # Full data model (SQLite → PostgreSQL ready)
│   └── migrations/
├── src/
│   ├── app/                   # Next.js App Router pages (phased rollout)
│   ├── generated/prisma/      # Prisma client (auto-generated)
│   └── lib/
│       ├── db.ts              # Prisma singleton
│       ├── enums/             # TypeScript enums & constants
│       ├── schemas/           # Zod schemas (AI output validation)
│       ├── services/          # Business logic services
│       │   ├── auditService.ts
│       │   ├── checklistService.ts
│       │   ├── classificationService.ts
│       │   ├── fieldAutofillService.ts
│       │   ├── openaiExtractionService.ts
│       │   ├── modelo030MappingService.ts
│       │   └── modelo036MappingService.ts
│       └── types/             # Shared TypeScript interfaces
├── uploads/                   # Local document storage (MVP)
├── .env.example
└── README.md
```

---

## Phase 2 — AI Autofill Workflow

1. Go to **New Case** (`/cases/new`)
2. Paste email content, CRM JSON, and/or upload documents
3. Open the case and click **Run AI Extraction**
4. Go to **Review Dashboard** (`/cases/[id]/review`)
5. Correct fields, approve each one — all changes are audit-logged

### Pages available

| Route | Purpose |
|-------|---------|
| `/dashboard` | KPIs and case status overview |
| `/cases` | Case list |
| `/cases?filter=review` | Review queue |
| `/cases/new` | Manual intake + document upload |
| `/cases/[id]` | Case detail, upload docs, run extraction |
| `/cases/[id]/review` | Analyst review with editable AI fields |
| `/cases/[id]/modelo-030-draft` | Internal Modelo 030 draft + approval |
| `/cases/[id]/modelo-036-draft` | Internal Modelo 036 draft + NIF M unlock |
| `/cases/[id]/review-pack/modelo-030` | Printable Modelo 030 review pack |
| `/cases/[id]/review-pack/modelo-036` | Printable Modelo 036 review pack |
| `/cases/[id]/intake` | Add email / CRM to existing case |
| `/cases/[id]/aeat-preparation` | Manual AEAT prep + submission evidence |
| `/settings` | Admin: users, GDPR export/anonymization, retention |
| `/login` | Sign in |
| `/api/health` | Health check for monitoring |

### Phase 6 — Production readiness

1. Set `AUTH_SECRET` and run `npm run db:seed` to create demo users (change passwords in production)
2. Sign in — routes are protected by middleware
3. **RBAC:** analysts work cases; supervisors/admins approve Modelo drafts; admins access `/settings`
4. **PostgreSQL:** `docker compose up -d`, switch `provider` in `schema.prisma`, update `DATABASE_URL`, run `db:migrate`
5. **Storage:** `STORAGE_PROVIDER=local` by default; cloud provider interface ready for Supabase/S3
6. **GDPR:** admin can export case JSON or anonymize PII from `/settings`
7. **Monitoring:** `GET /api/health` returns DB connectivity status

### Phase 5 — Integrations & AEAT Preparation

#### Automatic Gmail + HubSpot (recommended)

1. Sign in as **admin** and open **Integrations** (`/integrations`)
2. **Gmail:** click **Connect Gmail** — OAuth redirect URI in Google Cloud Console:
   `https://your-app.vercel.app/api/integrations/gmail/callback`
3. **HubSpot:** create a Private App token and save it on the Integrations page (or set `HUBSPOT_ACCESS_TOKEN` in env)
4. Set `CRON_SECRET` on Vercel — cron runs every 15 minutes (`vercel.json`) and pulls new emails/contacts
5. Use **Sync now** for immediate pull; the system creates/updates cases and runs AI extraction automatically

#### Manual intake (fallback)

1. Open **AI Intake** on an existing case to paste email or import CRM JSON
2. Optionally check **Run AI extraction** to process new data immediately
3. Use **POST /api/webhooks/ingest** for external CRM/automation integrations
4. When drafts are approved, open **AEAT Preparation**
5. Follow manual instructions — submit via AEAT outside TaxFlow Spain
6. Upload receipt and reference number as **Submission Evidence**

#### Webhook example

```bash
curl -X POST http://localhost:3000/api/webhooks/ingest \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-webhook-secret-here" \
  -d '{
    "source": "hubspot",
    "create_case": true,
    "contact_name": "Jane Doe",
    "contact_email": "jane@company.com",
    "company_name": "Example SL",
    "crm": {
      "name": "hubspot",
      "external_record_id": "999",
      "data": { "vat_number": "DE123456789" }
    }
  }'
```

---

1. Open a case with draft data (Phases 2–3)
2. From the Modelo draft page, click **Open Review Pack**
3. Review the full printable document
4. Click **Print Review Pack** (or Ctrl+P) — sidebar hidden automatically

---

### Phase 3 — Modelo Draft Workflow

1. Complete AI extraction and field review (Phase 2)
2. Open **Modelo 030 Draft** or **Modelo 036 Draft** from the case page
3. Click **Generate Draft** — maps approved AI data into internal form fields
4. Edit any field, fix missing required fields (highlighted in amber)
5. Click **Approve Draft** — records human approval in audit log
6. For Modelo 036: if locked, mark **NIF M Received** first to unlock

---

## Foundation Services (Phase 1–2)

| Service | Purpose |
|---------|---------|
| `classificationService` | Deterministic rules after AI extraction (Modelo 030/036, VAT, ROI) |
| `checklistService` | Generate required document checklist from classification |
| `auditService` | Compliance audit trail logging |
| `openaiExtractionService` | Server-side OpenAI structured extraction (skeleton ready) |
| `fieldAutofillService` | Map AI output → reviewable autofill fields with provenance |
| `modelo030MappingService` | Internal Modelo 030 draft mapping (not official submission) |
| `modelo036MappingService` | Internal Modelo 036 draft mapping (not official submission) |
| `draftService` | Generate, edit, and approve Modelo 030/036 drafts |
| `reviewPackService` | Build printable internal review packs |
| `emailIngestionService` | Ingest email into existing cases |
| `crmIngestionService` | Import CRM JSON records |
| `webhookIngestionService` | Generic webhook case creation/update |
| `gmailSyncService` | Pull unread Gmail → cases + AI extraction |
| `hubspotSyncService` | Pull HubSpot contacts → cases + AI extraction |
| `integrationSyncService` | Run Gmail + HubSpot sync (cron / manual) |
| `aeatPreparationService` | Readiness checks + submission evidence |
| `gdprService` | GDPR export, anonymization, retention review |
| `userService` | Profile listing and user creation |

---

## Database Commands

```bash
npm run db:generate   # Regenerate Prisma client
npm run db:migrate      # Apply migrations (development)
npm run db:push         # Push schema without migration (prototyping)
npm run db:studio       # Open Prisma Studio GUI
npm run db:seed         # Seed demo users (admin, supervisor, analyst)
```

---

## Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Core MVP: schema, services, audit, classification, checklist | ✅ Done |
| **2** | AI autofill: extraction, document upload, review dashboard | ✅ Done |
| **3** | Modelo 030/036 draft pages, missing fields, approval controls | ✅ Done |
| **4** | Review Packs (printable HTML) | ✅ Done |
| **5** | Email/CRM ingestion, webhooks, AEAT preparation | ✅ Done |
| **6** | Production: PostgreSQL, auth, RBAC, cloud storage, GDPR | ✅ Done |

---

## Compliance & Security

- OpenAI API key stored in environment variables only
- All AI calls execute server-side
- AI prepares drafts — humans approve and submit
- Audit log records every significant action
- No automatic AEAT submission in MVP
- File upload validation (type/size)
- Authentication & RBAC (NextAuth, ANALYST / SUPERVISOR / ADMIN)
- Security headers (X-Frame-Options, nosniff, etc.)
- GDPR export and anonymization tools (admin)

---

## Migrating SQLite → PostgreSQL

1. Start PostgreSQL: `docker compose up -d`
2. Update `DATABASE_URL` in `.env`:
   `postgresql://taxflow:taxflow_dev@localhost:5432/taxflow_spain?schema=public`
3. Change `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`
4. Run `npm run db:migrate` and `npm run db:seed`
5. `src/lib/db.ts` auto-selects the PostgreSQL adapter when `DATABASE_URL` starts with `postgres`

---

## License

Internal use — TaxFlow Spain © 2026
