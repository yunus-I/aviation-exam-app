# Release Checklist

## Before Deployment

1. Fill all values in [.env.example](/c:/Users/hp/OneDrive/Desktop/aviation/.env.example) and copy them into your real deployment environment.
2. Run all database migrations in `supabase/migrations`.
3. Seed your main admin account using [supabase/seeds/001_admin_account.sql](/c:/Users/hp/OneDrive/Desktop/aviation/supabase/seeds/001_admin_account.sql).
4. Import your first real exam set using the payload format in [docs/content-import.md](/c:/Users/hp/OneDrive/Desktop/aviation/docs/content-import.md).

## Deploy

1. Deploy the Next.js app to Vercel.
2. Set all environment variables in Vercel.
3. Confirm the app responds at `/api/health`.
4. Register the Telegram webhook using [scripts/register-telegram-webhook.ps1](/c:/Users/hp/OneDrive/Desktop/aviation/scripts/register-telegram-webhook.ps1).
5. Set the Telegram Mini App URL to your production `NEXT_PUBLIC_MINI_APP_URL`.

## Verify in Production

1. Open the bot and complete a full registration with a test account.
2. Confirm the admin receives the receipt, Telegram id, username, and approve/reject buttons.
3. Approve the test user and confirm the status changes inside the Mini App.
4. Confirm the approved student sees the exam dashboard.
5. Confirm a live published exam loads when content exists.
6. Confirm the demo fallback appears when no live exam is published yet.

## First Pilot Launch

1. Import one clean exam set for each department.
2. Test one candidate from each department.
3. Review UI spacing and readability inside the Telegram mobile app.
4. Monitor registrations, approvals, and exam flow during the first real batch.

## Useful Files

- Health endpoint: [src/app/api/health/route.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/app/api/health/route.ts)
- Webhook script: [scripts/register-telegram-webhook.ps1](/c:/Users/hp/OneDrive/Desktop/aviation/scripts/register-telegram-webhook.ps1)
- Example import file: [scripts/example-content-import.json](/c:/Users/hp/OneDrive/Desktop/aviation/scripts/example-content-import.json)
