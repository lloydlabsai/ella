/* ═══════════════════════════════════════════════════════════
   Ella — Extension Config

   Chrome extensions can't read .env files, so point the
   extension at your own Supabase project here.

   Both values are safe to keep in the extension: the anon key
   is a publishable client key, and every table is protected by
   row-level security so users only ever see their own rows.

   Find both under: Supabase dashboard → Project Settings → API
   ═══════════════════════════════════════════════════════════ */

export const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co";
export const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
