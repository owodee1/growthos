-- GrowthOS ticket P1-03: organisation, workspaces, memberships.
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Every table has row-level security, so data is protected in the database,
-- not only in the app.

-- ---------------------------------------------------------------- tables

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Platform-level administrators (super admin, group administrator).
-- They can see and manage every workspace in the organisation.
create table public.organization_members (
  user_id uuid not null,
  organization_id uuid not null references public.organizations (id),
  role text not null check (role in ('super_admin', 'group_admin')),
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name text not null check (length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  relationship text not null check (relationship in ('own', 'client', 'partner')),
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  created_at timestamptz not null default now()
);

-- One profile per sign-in account. Filled automatically (see trigger below).
create table public.profiles (
  id uuid primary key,
  email text,
  name text not null default '',
  created_at timestamptz not null default now()
);

create table public.memberships (
  user_id uuid not null references public.profiles (id),
  business_id uuid not null references public.businesses (id),
  role text not null check (
    role in ('workspace_admin', 'sales_manager', 'team_leader', 'sales_agent')
  ),
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);

create index memberships_business_idx on public.memberships (business_id);

-- ------------------------------------------------- profiles from sign-ins

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts that already exist (for example the owner's).
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- ------------------------------------------------------- access helpers
-- These run with elevated rights so policies can use them without looping.

create function public.is_group_admin(org uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members om
    where om.user_id = auth.uid() and om.organization_id = org
  );
$$;

create function public.is_member(biz uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.business_id = biz
  );
$$;

-- True for a workspace admin of this workspace, or a group administrator.
create function public.can_manage_workspace(biz uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select
    exists (
      select 1 from public.memberships m
      where m.user_id = auth.uid() and m.business_id = biz
        and m.role = 'workspace_admin'
    )
    or exists (
      select 1
      from public.businesses b
      join public.organization_members om on om.organization_id = b.organization_id
      where b.id = biz and om.user_id = auth.uid()
    );
$$;

-- Who may see a person's name and email: yourself, people in a workspace you
-- belong to, and (for group administrators) anyone in the organisation.
create function public.can_see_profile(p uuid)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select
    p = auth.uid()
    or exists (
      select 1
      from public.memberships a
      join public.memberships b on a.business_id = b.business_id
      where a.user_id = auth.uid() and b.user_id = p
    )
    or exists (
      select 1
      from public.memberships b
      join public.businesses bz on bz.id = b.business_id
      join public.organization_members om on om.organization_id = bz.organization_id
      where b.user_id = p and om.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.organization_members o1
      join public.organization_members o2 on o1.organization_id = o2.organization_id
      where o1.user_id = p and o2.user_id = auth.uid()
    );
$$;

-- ----------------------------------------------------------- add a member
-- The only way to add someone to a workspace. Looks the person up by email
-- without exposing the list of all accounts.

create function public.add_member_by_email(
  p_business uuid,
  p_email text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if auth.uid() is null then
    raise exception 'You are not signed in.';
  end if;

  if not public.can_manage_workspace(p_business) then
    raise exception 'You do not have permission to add members to this workspace.';
  end if;

  if p_role not in ('workspace_admin', 'sales_manager', 'team_leader', 'sales_agent') then
    raise exception 'That role does not exist.';
  end if;

  select id into v_user
  from public.profiles
  where lower(email) = lower(trim(p_email));

  if v_user is null then
    raise exception 'No account exists for that email yet. Create the account in Supabase first (Authentication, then Users).';
  end if;

  insert into public.memberships (user_id, business_id, role)
  values (v_user, p_business, p_role)
  on conflict (user_id, business_id) do update set role = excluded.role;
end;
$$;

-- ------------------------------------------------------------- privileges

revoke all on all tables in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon;

grant select on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select, insert on public.businesses to authenticated;
grant update (name, status) on public.businesses to authenticated;
grant select on public.profiles to authenticated;
grant update (name) on public.profiles to authenticated;
grant select, delete on public.memberships to authenticated;
grant update (role) on public.memberships to authenticated;

grant execute on function public.is_group_admin(uuid) to authenticated;
grant execute on function public.is_member(uuid) to authenticated;
grant execute on function public.can_manage_workspace(uuid) to authenticated;
grant execute on function public.can_see_profile(uuid) to authenticated;
grant execute on function public.add_member_by_email(uuid, text, text) to authenticated;

-- --------------------------------------------------- row-level security

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;

create policy organizations_read on public.organizations
  for select to authenticated
  using (public.is_group_admin(id));

create policy organization_members_read on public.organization_members
  for select to authenticated
  using (user_id = auth.uid() or public.is_group_admin(organization_id));

create policy businesses_read on public.businesses
  for select to authenticated
  using (public.is_member(id) or public.is_group_admin(organization_id));

create policy businesses_create on public.businesses
  for insert to authenticated
  with check (public.is_group_admin(organization_id));

create policy businesses_edit on public.businesses
  for update to authenticated
  using (public.can_manage_workspace(id))
  with check (public.can_manage_workspace(id));

create policy profiles_read on public.profiles
  for select to authenticated
  using (public.can_see_profile(id));

create policy profiles_edit_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy memberships_read on public.memberships
  for select to authenticated
  using (user_id = auth.uid() or public.can_manage_workspace(business_id));

create policy memberships_edit on public.memberships
  for update to authenticated
  using (public.can_manage_workspace(business_id))
  with check (public.can_manage_workspace(business_id));

create policy memberships_remove on public.memberships
  for delete to authenticated
  using (public.can_manage_workspace(business_id));
