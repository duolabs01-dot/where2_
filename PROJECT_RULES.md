# where2_ Project Rules for Aider



You are editing a Next.js 14+ App Router project (TypeScript strict, Tailwind CSS, Supabase for venues/operating hours/migrations, Gemini API for location/venue features).



## Core Rules (never break these)

- TypeScript: strict mode, explicit types, no `any`, functional components + hooks only.

- Tailwind: always match existing component styles (see `components/` folder). 

- Supabase: use client from `lib/supabase.ts`; prefer raw SQL in migrations for schema changes.

- Operating hours logic: must handle 24/7 venues, SAST (Johannesburg) timezone, multi-day spans, validation scripts (`npm run hours:verify`, `hours:apply`).    

- Gemini API: add retry logic + caching where missing; protect `NEXT_PUBLIC_GEMINI_API_KEY`.

- Vercel deploy: never break `npm run build`. Protect all env vars.

- Git: use conventional commit messages. Always suggest running `npm run build` and fix any errors.

- Style: readable, maintainable code with JSDoc for public functions/APIs.     



## Current Priority

Fix all operating hours edge cases from the Claude session (24/7 venues, timezone bugs, migration failures, UI on venue pages).



When I say "fix operating hours", always:

1. Run `npm run hours:verify`

2. Show failures

3. Create/update migration if needed

4. Update UI components

5. Test build
