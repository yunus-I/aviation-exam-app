# Exam Engine

## Current Phase 5 Scope

The current exam engine is a frontend workbench that gives approved users a real test-taking experience while backend exam APIs are still pending.

## Included Features

- timed mock exam flow
- single choice, multiple choice, and true/false support
- image-based questions
- question palette
- flag for review
- local autosave
- result summary and feedback

## Current Data Source

The engine currently uses a demo exam set in:

- [src/features/exam/mock-data.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/features/exam/mock-data.ts)

This is intentional for Phase 5 so the interaction model is built before the full content-management phase.

## Main Files

- Workbench: [src/features/exam/exam-workbench.tsx](/c:/Users/hp/OneDrive/Desktop/aviation/src/features/exam/exam-workbench.tsx)
- Types: [src/features/exam/types.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/features/exam/types.ts)
- Utilities: [src/features/exam/utils.ts](/c:/Users/hp/OneDrive/Desktop/aviation/src/features/exam/utils.ts)

## Next Upgrade Path

1. Replace demo questions with `exam_sets`, `exam_set_questions`, `questions`, and `question_options` from PostgreSQL.
2. Persist attempts and answers into `exam_attempts` and `attempt_answers`.
3. Add practice mode and department-specific exam selection.

## Current Upgrade Status

- live exam loading route added
- approved students now request department-based published exam content first
- demo exam remains as fallback when no live set is published yet
