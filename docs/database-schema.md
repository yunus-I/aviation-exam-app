# Database Schema

## Overview

The database is designed around four flows:

1. Candidate registration through Telegram
2. Admin approval and rejection review history
3. Exam content management with image support
4. Candidate exam attempts, scoring, and progress

The initial schema lives in:

- [supabase/migrations/20260424_001_initial_schema.sql](/c:/Users/hp/OneDrive/Desktop/aviation/supabase/migrations/20260424_001_initial_schema.sql)

## Main Tables

### Candidate and Registration

- `candidates`
  Stores Telegram identity, selected language, current approval state, and the latest approved registration link.

- `registration_submissions`
  Stores each submitted registration snapshot, including department, region, phone, password hash, receipt path, Telegram receipt file id, and review state.

- `registration_reviews`
  Stores approval or rejection history for auditability.

- `registration_drafts`
  Stores in-progress Telegram registration state so the bot can resume safely between messages.

- `admin_accounts`
  Stores Telegram admins who can review applications.

### Reference Data

- `departments`
  Seeds the four entrance departments.

- `regions`
  Seeds Ethiopian regions and city administrations for registration.

- `topics`
  Seeds exam topic families such as aptitude, reasoning, mathematics, and mechanical reasoning.

### Exam Content

- `question_banks`
  Organizes pools of questions by department and topic.

- `questions`
  Stores bilingual question text, source metadata, difficulty, and scoring weight.

- `question_media`
  Stores image references for questions.

- `question_options`
  Stores answer choices and correctness flags.

### Exams and Attempts

- `exam_sets`
  Stores practice and mock exam definitions, timing, shuffle rules, and publish state.

- `exam_set_questions`
  Connects questions into a given exam set.

- `exam_attempts`
  Stores candidate sessions, timing, randomized order, and final score stats.

- `attempt_answers`
  Stores selected answers, flags, and correctness per question.

## Design Notes

- Registration is modeled as a separate submission record so candidates can reapply without losing audit history.
- Passwords are stored as `password_hash`, never as plain text.
- Telegram identity is captured directly from bot interaction with `telegram_user_id` and `telegram_username`.
- The schema supports bilingual content with `*_en` and `*_am` fields.
- Image-based questions are supported through `question_media`.
- Exam randomization is supported through stored `question_order` and `option_order` snapshots on each attempt.
- `import_key` fields are used on content tables to support repeatable admin imports without duplicating records.

## Storage Buckets

The migration also creates two Supabase storage buckets:

- `registration-receipts`
- `question-media`

Both are created as non-public buckets so access can be controlled from the backend.

## Next Build Steps

Phase 3 should now build on top of this schema in this order:

1. Create the Telegram bot registration conversation.
2. Save candidate and registration submission records.
3. Upload receipt screenshots to `registration-receipts`.
4. Send admin review messages with approve or reject callbacks.
5. Update candidate access state after review.
