# Product Plan

## Phase 1: Foundation

- Create the application skeleton
- Choose free-tier infrastructure
- Define the core modules for bot, web app, and data layer
- Prepare environment variables and deployment assumptions

## Phase 2: Database

- Design PostgreSQL schema
- Add migrations for users, registrations, questions, exams, and attempts
- Set up storage buckets for receipts and question images

## Phase 3: Registration Bot

- Build English and Amharic onboarding
- Ask for name, department, region, phone, and password
- Accept payment receipt screenshot
- Notify admin account with approve and reject buttons

## Phase 4: Approval Workflow

- Allow admin to approve or reject from Telegram
- Notify candidate about decision
- Unlock Mini App access only for approved users

## Phase 5: Exam Mini App

- Build a mobile-first dashboard
- Add practice and mock exam modes
- Support image questions, timing, autosave, and results

## Phase 6: Content Operations

- Add admin tools for question entry and import
- Organize content by department, topic, and difficulty

## Phase 7: QA and Launch

- Run device testing inside Telegram
- Verify reliability and security
- Deploy production version
