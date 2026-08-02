-- ═══════════════════════════════════════════════════════════
-- Ella — Harden the signup trigger function
--
-- Supabase's database linter flags three issues on the
-- handle_new_user() function created in 001:
--   1. Mutable search_path on a SECURITY DEFINER function
--   2. anon can EXECUTE it via /rest/v1/rpc/handle_new_user
--   3. authenticated can EXECUTE it via the same route
--
-- It is a trigger function, so nothing should ever call it
-- directly. Pin the search_path and revoke EXECUTE.
-- ═══════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$;

-- The trigger runs as the table owner, so revoking these does not
-- affect signup. It only removes the function from the public API.
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
