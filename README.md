# Arovia Yathra — TypeScript + Supabase edition

This is the original static demo (HTML/CSS/vanilla JS, all data in
`localStorage`) rebuilt as a real, typed, database-backed web app:

- **Vite + TypeScript** — the old 1,000-line `script.js` is split into typed
  modules under `src/`, bundled and minified for production.
- **Supabase (Postgres)** — properties, vehicles, tours, bookings, reviews
  and site settings now live in a real database instead of the visitor's
  browser, with Row Level Security controlling who can read/write what.
- **Supabase Auth** for the admin dashboard, instead of a hardcoded password
  list in JavaScript.

See `README-SUPABASE.md` for the step-by-step database setup — start there.

## Project layout
```
index.html                 same markup as before, script tag now loads /src/main.ts
src/
  main.ts                  boots the app, wires window.* handlers for the inline onclick attrs
  types.ts                 shared TypeScript interfaces
  state.ts                 in-memory cache of what's currently loaded from Supabase
  style.css                unchanged styles
  lib/
    supabaseClient.ts      Supabase client, reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
    api.ts                 every Supabase query/mutation, typed
    wishlist.ts            wishlist (stays in this browser — there's no customer login)
    utils.ts                esc/toast/debounce/etc.
  render/
    public.ts               stays, tours, vehicles, places, reviews, wishlist UI
    booking.ts               booking modal flow, review modal, generic modal/nav helpers
    admin.ts                 admin login, dashboard, CRUD, charts, CSV export
supabase/
  schema.sql                run this once in the Supabase SQL editor
```

## Run locally
```bash
npm install
cp .env.example .env        # then fill in your Supabase URL + anon key
npm run dev
```

## Build for production
```bash
npm run build      # outputs to dist/
npm run preview    # sanity-check the production build locally
```
Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare
Pages, GitHub Pages, etc.) — remember to set `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` as environment variables on the host too, since
Vite bakes them in at build time.

## Performance notes vs. the original
- All markup/logic is now bundled and minified by Vite (esbuild), and the
  Supabase SDK is split into its own lazily-loaded chunk.
- The whole catalog (properties/vehicles/tours/reviews/settings) is fetched
  **once** on load and cached in memory (`src/state.ts`); every filter,
  search, and re-render works off that cache with zero extra network
  requests. Only actual writes (bookings, admin edits) hit the network.
- The "Where" search box now filters live as you type, debounced to one
  render per 250ms instead of one per keystroke.
- Fonts already used `preconnect` + `display=swap` in the original file —
  kept as-is.

## What intentionally didn't change
- The visual design, layout, and CSS are untouched.
- The wishlist stays device-local (no customer accounts exist, so there's
  nothing meaningful to sync to a database yet).
- "Sign in" for customers is still a no-op demo, same as the original.
