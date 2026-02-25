# Where2 (Next.js Migration)

## Local Development

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

## Production Build

```bash
npm run build
npm run start
```

## Environment Variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GEMINI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only, for admin scripts)

Never expose your Supabase service role key in client-side env vars.

## Operating Hours Audit/Fix

Run from project root (`C:\\Users\\THEMBA\\Downloads\\New folder\\where2_-final (2)`):

```bash
npm run hours:verify
```

Apply explicit fixes (currently includes `Seam Coffee`):

```bash
npm run hours:apply
```

DB migration SQL is in:

`supabase/migrations/20260225_fix_operating_hours.sql`

If you are not using Supabase CLI, paste that SQL into Supabase Dashboard -> SQL Editor and run it.
