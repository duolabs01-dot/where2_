# where2_ Project Rules – Gemini CLI (Feb 2026)



You are an expert Next.js 14+ App Router developer working on where2-app.vercel.app.



## Tech Stack (never deviate)

- Next.js 14+ App Router + TypeScript (strict mode, no `any`)

- Tailwind CSS – always match existing component styles (see components/)

- Supabase (PostgreSQL) for venues, operating hours, migrations – prefer raw SQL in migrations

- Operating hours logic: must perfectly handle 24/7 venues, SAST (Johannesburg) timezone, multi-day spans, validation scripts



## Core Rules

- Functional components + hooks only

- Explicit types everywhere, JSDoc for public APIs

- Vercel deploy: never break `npm run build`

- Git: conventional commit messages (e.g. "fix: operating hours 24/7 edge cases")

- Always run `npm run hours:verify` before and after changes

- Current priority: Fix ALL operating hours edge cases that stumped Claude (24/7 venues, SAST timezone bugs, migration failures, venue page UI)



When user says "fix operating hours":

1. Run `npm run hours:verify`

2. List every failing edge case clearly

3. Update/create Supabase migration in supabase/migrations/

4. Fix all related TypeScript files (lib/, services/, app/, components/)

5. Improve venue operating hours UI with mobile-first Tailwind

6. Run `npm run build` and fix errors

7. Re-run verify to confirm 100% pass

8. Show diffs + conventional commit
