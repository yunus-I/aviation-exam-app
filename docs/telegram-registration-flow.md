# Telegram Registration Flow

## Entry

- User sends `/start`
- Bot creates or refreshes the candidate record
- Bot resets the draft and asks for language selection

## Registration Steps

1. `language`
2. `full_name`
3. `department`
4. `region`
5. `phone_number`
6. `password`
7. `receipt`
8. `completed`

The current step is stored in `registration_drafts`, so the registration can survive webhook restarts.

## Admin Review

- After receipt upload, the bot creates a `registration_submissions` row
- The bot creates a `registration_reviews` row with action `submitted`
- The bot sends the receipt photo and candidate summary to the admin chat
- Admin taps `Approve` or `Reject`
- The bot updates submission and candidate status
- The bot notifies the candidate about the decision

## Files

- Bot service: [src/features/bot/service.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/features/bot/service.ts)
- Bot repository: [src/features/bot/repository.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/features/bot/repository.ts)
- Webhook route: [src/app/api/telegram/webhook/route.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/app/api/telegram/webhook/route.ts)
