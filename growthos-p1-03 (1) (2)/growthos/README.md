# GrowthOS

Beyond Limit's sales growth management system.

Tickets built so far: P1-01 (starter project), P1-02 (sign-in) and P1-03 (workspaces and members).

## P1-03: workspaces and members

A workspace is one business (Fiyesi, Fork & Flames and so on) with its own team. Each person only sees the workspaces they have been added to. Group administrators (you) see all of them and can create new ones.

The protection lives in the database, not just in the screens. Every table has row-level security, so even a mistake in the app cannot show one client's data to another.

### Set it up (owner does this once, in Supabase)

You need your sign-in account from P1-02 first.

1. **Create the tables.** Supabase, SQL Editor, New query. Open `supabase/migrations/0001_workspaces.sql` from this folder, copy everything, paste it in and click Run. It should say "Success".
2. **Create your organisation and first workspaces.** New query again. Open `supabase/seed.sql`, replace `REPLACE_WITH_YOUR_EMAIL` with the email of your account, paste it in and click Run. It creates the Beyond Limit organisation, makes you super admin, and creates two workspaces: Beyond Limit and Fiyesi. Run it only once.
3. **Upload the new code** to GitHub so Vercel redeploys.
4. **Try it.** Sign in. You should see two workspaces. Open Fiyesi, then Members. Then try New workspace on the home page (you can create Fork & Flames, Strong Tower Academy and SOMA this way).

### Adding a staff member

1. In Supabase, Authentication, Users, Add user, Create new user. Enter their work email and a password. Tick Auto Confirm User. Give them the password privately.
2. In GrowthOS, open the workspace, then Members, then enter their email and choose a role.

A person can be in several workspaces with a different role in each. Removing them removes their access straight away.

### Roles

Workspace admin, Sales manager, Team leader and Sales agent are stored now. Only workspace admins and group administrators can manage members. What the other roles can do is added as leads and the pipeline are built.

Done when: you can create a workspace, add a person to it, and that person sees only that workspace.

### What was checked

`npm run test:db` runs the real migration in an in-memory Postgres and runs 36 checks, including: a Fiyesi agent cannot see Fork & Flames, cannot see its members or their profiles, cannot create or rename workspaces, and cannot promote themselves; a workspace admin cannot touch another workspace; a signed-out visitor sees nothing. The test fails if row-level security is switched off, so it does catch leaks. It runs on every GitHub check.

The screens were built and checked to compile, and signed-out visitors are redirected to the login page. The screens have not been tried against a real Supabase project, so step 4 above is the real test.

## P1-02: sign-in

Staff sign in with email and password. There is no public sign-up. The administrator creates every account.

Setup (if not done yet):

1. Supabase, Authentication, Sign In / Providers, Email: keep it on and switch off "Allow new users to sign up".
2. Authentication, Users, Add user: create your own account (tick Auto Confirm User).
3. Project Settings, API Keys: copy the Project URL and the publishable key. Never copy the secret or service role key.
4. Vercel, Project Settings, Environment Variables: add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Redeploy.

Until those settings exist, the app runs and shows a note that sign-in is not set up. `/api/health` stays public.

## P1-01: starter project

A Next.js (TypeScript) app with a health check at `/api/health`, an automatic check on GitHub for each change, and a staging site on Vercel.

## Run it on your own computer (optional)

```
npm install
cp .env.example .env.local
npm run dev
```

## Checks

```
npm run typecheck
npm run test:db
npm run build
```

## Next ticket

P1-04 finishes access control by role (what each role can do), then P1-05 adds the product and plan catalogue.
