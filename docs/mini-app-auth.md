# Mini App Auth Flow

## Goal

The Mini App should only show the student dashboard after verifying the Telegram user on the server.

## Flow

1. User opens the Mini App from Telegram.
2. Telegram provides `WebApp.initData`.
3. The frontend posts that raw init data to `/api/mini-app/session`.
4. The server verifies the signature using the bot token.
5. The server looks up the candidate by `telegram_user_id`.
6. The UI renders one of these states:
   - `approved`
   - `pending_review`
   - `rejected`
   - `draft`
   - `submitted`
   - not registered

## Files

- Session API: [src/app/api/mini-app/session/route.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/app/api/mini-app/session/route.ts)
- Telegram verification: [src/lib/telegram.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/lib/telegram.ts)
- Candidate lookup: [src/features/auth/repository.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/features/auth/repository.ts)
- Dashboard shell: [src/app/mini-app-shell.tsx](/c:/Users/hp/OneDrive/Desktop/aviation/src/app/mini-app-shell.tsx)
