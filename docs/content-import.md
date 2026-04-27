# Content Import

## Goal

This phase adds a secure admin import route so real entrance questions and exam sets can be loaded into PostgreSQL without editing the database manually.

## Import Route

- `POST /api/admin/content/import`

The route:

1. verifies Telegram Mini App init data
2. confirms the caller is an active admin in `admin_accounts`
3. upserts the question bank
4. upserts the exam set
5. upserts questions by `import_key`
6. replaces exam-question mappings for the imported exam set

## Student Exam Route

- `POST /api/exams/session-content`

This route verifies the approved student and returns the latest published exam set for that student's department.

## Payload Shape

```json
{
  "questionBank": {
    "key": "pilot-bank-2026",
    "slug": "pilot-entrance-bank-2026",
    "title": "Pilot Entrance Bank 2026",
    "description": "Imported pilot entrance preparation questions",
    "departmentCode": "PILOT",
    "topicSlug": "aptitude"
  },
  "examSet": {
    "key": "pilot-mock-2026-01",
    "slug": "pilot-mock-2026-01",
    "title": "Pilot Mock Exam 2026 - Set 1",
    "description": "First pilot mock exam set",
    "departmentCode": "PILOT",
    "topicSlug": "aptitude",
    "mode": "mock",
    "durationMinutes": 35,
    "passingScore": 24,
    "published": true
  },
  "questions": [
    {
      "key": "pilot-q-0001",
      "topicSlug": "aptitude",
      "type": "single_choice",
      "prompt": "Which number comes next in the sequence 3, 6, 12, 24?",
      "explanation": "Each term doubles, so the next number is 48.",
      "points": 1,
      "difficultyLevel": 1,
      "sourceLabel": "Imported mock set",
      "sourceYear": 2026,
      "options": [
        { "key": "A", "text": "36", "isCorrect": false },
        { "key": "B", "text": "42", "isCorrect": false },
        { "key": "C", "text": "48", "isCorrect": true },
        { "key": "D", "text": "54", "isCorrect": false }
      ]
    }
  ]
}
```

## Files

- Import API: [src/app/api/admin/content/import/route.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/app/api/admin/content/import/route.ts)
- Student exam API: [src/app/api/exams/session-content/route.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/app/api/exams/session-content/route.ts)
- Repository: [src/features/exam/repository.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/features/exam/repository.ts)
- Import payload types: [src/features/exam/content-types.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/features/exam/content-types.ts)
