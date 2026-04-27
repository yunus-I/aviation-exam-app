# Architecture

## Core Modules

### 1. Telegram Bot Layer

- Handles `/start`
- Runs bilingual registration flow
- Collects payment receipt screenshot
- Sends admin review message with inline buttons
- Notifies user after approval or rejection

### 2. Telegram Mini App Layer

- Runs inside Telegram WebApp
- Verifies Telegram init data on the server
- Shows pending, approved, or rejected access state
- Hosts the exam dashboard and exam-taking interface

### 3. Backend Layer

- Stores registrations and exam data in PostgreSQL
- Stores receipts and question images in object storage
- Calculates scores and writes exam attempts

### 4. Admin Operations

- Initial version uses Telegram itself for approvals
- Later version can add a full admin dashboard

## Deployment

- Frontend and API: `Vercel`
- Database and file storage: `Supabase`
- Bot webhook: `Next.js` route handler or dedicated server endpoint

## Security Notes

- Never trust client-side Telegram user data without server verification
- Store passwords securely with hashing
- Restrict admin actions to approved Telegram IDs
- Use signed URLs or controlled bucket access for sensitive uploads
