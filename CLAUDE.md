@AGENTS.md

# EasyHire VA Solutions — Project Instructions

## Project Overview

EasyHire VA Solutions is a two-sided recruitment marketplace connecting Virtual Assistants (job seekers) with employers/clients. Built solo by a Founding Full-Stack Engineer on a 3-month timeline.

## Tech Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Prisma ORM + PostgreSQL (hosted on Supabase)
- NextAuth.js for auth with role-based access: seeker / employer / admin
- Resend for email notifications
- Stripe for payments (job posting fees / employer subscriptions)
- Supabase Storage for resumes and company logos

## Architecture Rules

- Keep this a monolith — do NOT introduce microservices or a separate search service (Algolia/Meilisearch) unless explicitly asked
- All DB access goes through Prisma — never write raw SQL unless necessary
- API routes live in /app/api — business logic lives in /lib, never inline in route handlers
- Role-gated pages live under /app/seeker, /app/employer, /app/admin
- Use Postgres full-text search for job search in the MVP — no external search service yet

## Database

- Core tables: users, seeker_profiles, companies, jobs, applications, saved_jobs, job_alerts, notifications, subscriptions
- users has a 1:1 relationship with either seeker_profiles or companies, depending on role
- Do not add new tables without checking against the existing schema first

## Conventions

- Database fields: snake_case
- TypeScript variables/functions: camelCase
- All forms validated with Zod schemas shared between client and server
- Routes follow the pattern: /seeker/_, /employer/_, /admin/\* for protected areas; public routes at root level (/jobs, /jobs/[id], /companies/[id])

## Brand

- Colors: Mist White (#F5F6F4) background, Deep Ink (#20242B) text, Harbor Navy (#1E3A5F) shared/structural, Marigold (#F2A93B) job-seeker accent, Signal Teal (#1F8073) employer accent, Ember (#D9553A) alerts only
- Typography: Space Grotesk for headlines only, Inter for body text, IBM Plex Mono for data/numbers (salary, job IDs)

## Subagents

- Use the `ui-ux-designer` subagent for any React component, page layout, Tailwind styling, or accessibility work
- Use the `backend-engineer` subagent for any API route, Prisma schema change, or /lib business logic
- These two agents should never edit each other's files — if a task spans both (e.g. "build the applicant dashboard"), split it: backend agent builds the API endpoint first, then hand off to the UI agent for the component

## Do Not

- Do not add new database tables or major features without checking against the project build plan first
- Do not skip the admin approval step for employer job postings — it's a fraud-prevention requirement
- Do not use Ember (red) for anything except genuine warnings/rejections
