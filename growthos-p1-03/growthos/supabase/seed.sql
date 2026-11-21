-- Run ONCE, after your own sign-in account exists (Authentication > Users).
-- 1. Replace REPLACE_WITH_YOUR_EMAIL below with the email of that account.
-- 2. Paste into Supabase SQL Editor and click Run.
-- It creates the Beyond Limit organisation, makes you its super admin, and
-- creates two workspaces: Beyond Limit and Fiyesi (the pilot client).

do $$
declare
  v_email text := 'REPLACE_WITH_YOUR_EMAIL';
  v_user uuid;
  v_org uuid;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email);
  if v_user is null then
    raise exception 'No account found for %. Create it first under Authentication, then Users.', v_email;
  end if;

  if exists (select 1 from public.organizations) then
    raise exception 'Already set up. This only needs to run once.';
  end if;

  insert into public.organizations (name) values ('Beyond Limit')
  returning id into v_org;

  insert into public.organization_members (user_id, organization_id, role)
  values (v_user, v_org, 'super_admin');

  insert into public.businesses (organization_id, name, slug, relationship)
  values
    (v_org, 'Beyond Limit', 'beyond-limit', 'own'),
    (v_org, 'Fiyesi', 'fiyesi', 'client');
end $$;
