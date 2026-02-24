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

Never expose your Supabase service role key in client-side env vars.
