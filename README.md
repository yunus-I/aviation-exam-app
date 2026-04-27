# Ethiopian Aviation University Entrance Exam Mini App

Telegram-based exam preparation platform for Ethiopian Aviation University entrance candidates.

## Goals

- Support four departments: `AMT Maintenance`, `Cabin Crew`, `Marketing`, and `Pilot`
- Use a Telegram bot for bilingual registration and payment receipt submission
- Use a Telegram Mini App for exam practice and mock exams
- Support image-based questions
- Prioritize robust functionality and high-quality mobile UI/UX
- Use PostgreSQL as the main database

## Tech Stack

- `Next.js` + `React` + `TypeScript`
- `grammY` for Telegram bot flows
- `Supabase PostgreSQL` for database and storage
- `Vercel` for web deployment

## Project Structure

```text
.
|-- src/
|   |-- app/                  # Telegram Mini App routes and pages
|   |-- components/           # UI building blocks
|   |-- config/               # App config and constants
|   |-- features/
|   |   |-- auth/             # Telegram Mini App auth
|   |   |-- bot/              # Telegram bot flow logic
|   |   |-- exam/             # Exam engine
|   |   |-- registration/     # Registration and approvals
|   |-- lib/                  # Shared libraries (db, telegram, utils)
|   |-- server/               # Server-only services and actions
|   |-- styles/               # Global CSS and design tokens
|   |-- types/                # Shared TypeScript types
|-- supabase/
|   |-- migrations/           # PostgreSQL migrations
|   |-- seeds/                # Local seed files
|-- docs/
|   |-- product-plan.md       # Phase-by-phase product plan
|   |-- architecture.md       # System architecture
```

## Phase 1 Deliverables

- Project scaffold
- Initial design system foundation
- Environment variable template
- Architecture documentation
- Product roadmap

## Next Phases

1. PostgreSQL schema and migrations
2. Telegram bot registration flow
3. Admin approval workflow
4. Telegram Mini App authentication
5. Exam engine and content management
6. UI/UX refinement and launch

## Database Files

- Schema migration: [supabase/migrations/20260424_001_initial_schema.sql](/c:/Users/hp/OneDrive/Desktop/aviation/supabase/migrations/20260424_001_initial_schema.sql)
- Registration draft migration: [supabase/migrations/20260424_002_registration_drafts.sql](/c:/Users/hp/OneDrive/Desktop/aviation/supabase/migrations/20260424_002_registration_drafts.sql)
- Schema guide: [docs/database-schema.md](/c:/Users/hp/OneDrive/Desktop/aviation/docs/database-schema.md)

## Flow Docs

- Telegram registration flow: [docs/telegram-registration-flow.md](/c:/Users/hp/OneDrive/Desktop/aviation/docs/telegram-registration-flow.md)
- Mini App auth flow: [docs/mini-app-auth.md](/c:/Users/hp/OneDrive/Desktop/aviation/docs/mini-app-auth.md)
- Exam engine: [docs/exam-engine.md](/c:/Users/hp/OneDrive/Desktop/aviation/docs/exam-engine.md)
- Content import: [docs/content-import.md](/c:/Users/hp/OneDrive/Desktop/aviation/docs/content-import.md)
- Release checklist: [docs/release-checklist.md](/c:/Users/hp/OneDrive/Desktop/aviation/docs/release-checklist.md)
