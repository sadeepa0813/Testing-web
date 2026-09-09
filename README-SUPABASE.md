# Supabase සකස් කරගන්නා විදිහ (Setup Guide)

## 1. Supabase project එකක් හදන්න
1. https://supabase.com වෙත ගොස් ගිණුමක් හදාගෙන, **New project** කරන්න.
2. Project එක create වුනාට පස්සේ, **Project Settings → API** page එකට යන්න.
3. එතන තියෙන **Project URL** සහ **anon public key** දෙක copy කරගන්න — මේ දෙක අපිට app එකට ඕන වෙනවා.

## 2. Database tables හදන්න
1. Supabase dashboard එකේ **SQL Editor → New query** කරන්න.
2. මේ project එකේ තියෙන `supabase/schema.sql` file එකේ තියෙන සම්පූර්ණ SQL එක copy කරලා paste කරන්න.
3. **Run** කරන්න. මේකෙන් `properties`, `vehicles`, `tours`, `bookings`, `reviews`, `settings`, `admin_profiles` කියන tables ටික + security rules + demo data ටික setup වෙනවා.

## 3. Admin login කරගන්න user හදන්න (Authentication)
Admin dashboard එකට enter වෙන්න Supabase Auth user කෙනෙක් ඕන (කලින් වගේ code එකේ hardcode කරපු password දෙකක් නෙවෙයි):

1. **Authentication → Users → Add user** කරන්න.
2. Email එකක් (උදා: `admin@aroviayathra.demo`) සහ ඔයාට ඕන password එකක් දාන්න. "Auto confirm user" tick කරන්න.
3. ආයෙත් SQL Editor එකට ගිහින් මේ query එක run කරන්න (UUID එක Users list එකේ තියෙනවා copy කරගන්න):
```sql
insert into public.admin_profiles (id, name, role, avatar)
values ('PASTE-THE-USER-UUID-HERE', 'Site Admin', 'Super Admin', 'SA');
```
4. Staff account එකකටත් ඕන නම් ඒකටත් 2-3 steps repeat කරන්න (`role` එක `'Staff'` කරන්න).

## 4. App එකට keys දෙන්න
Project root එකේ `.env.example` file එක `.env` කියලා copy කරගෙන, 1 වන step එකේදී copy කරගත් values දෙක දාන්න:
```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxx
```

## 5. Run කරන්න
```bash
npm install
npm run dev
```
Browser එකේ localhost address එක open කරාම site එක Supabase database එකෙන් data load කරගන්නවා. Public pages (Stays/Tours/Vehicles/Reviews) ඕනම කෙනෙකුට බලන්න පුළුවන්; Bookings/Reviews-management/Settings වගේ දේවල් වෙනස් කරන්න ඕන නම් 3 වන step එකේ හදාගත්ත admin account එකෙන් "Admin" button එකෙන් sign in වෙන්න ඕන.

## Production build
```bash
npm run build
```
`dist` folder එක ඕනම static hosting එකකට (Vercel/Netlify/Cloudflare Pages) දාන්න පුළුවන් — hosting එකේත් environment variables දෙක (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) set කරන්න අමතක කරන්න එපා.
