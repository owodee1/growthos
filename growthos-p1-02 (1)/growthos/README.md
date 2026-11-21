# GrowthOS

Beyond Limit's sales growth management system.

Tickets built so far: P1-01 (starter project) and P1-02 (sign-in).

## P1-02: sign-in

Staff sign in with email and password. There is no public sign-up. The administrator creates every account, which keeps client data limited to people you have chosen.

Until the Supabase settings are added, the app still runs and shows a note that sign-in is not set up. Once they are added, everyone who is not signed in is sent to the login page. `/api/health` stays public.

### Set it up (owner does this once)

1. **Supabase, turn off public sign-up.** Open your `growthos` project, then Authentication, then Sign In / Providers, then Email. Keep Email enabled and switch off "Allow new users to sign up". Save.
2. **Supabase, create your account.** Authentication, then Users, then Add user, then Create new user. Enter your email and a strong password (a password manager is best) and tick Auto Confirm User.
3. **Supabase, copy two values.** Project Settings, then API Keys. Copy the Project URL and the publishable key. Never copy the secret or service role key.
4. **Vercel, add the settings.** Project Settings, then Environment Variables. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with those two values, for the staging and production environments. Redeploy.
5. **Try it.** Open the site. You should land on the login page. Sign in with the account from step 2, see "You are signed in as" with your email, then click Sign out and confirm you are back on the login page.

Done when: a user can sign in and out, and a signed-out visitor cannot see any page except the login page and `/api/health`.

### What was checked

The code type-checks and builds. With no Supabase settings, the app shows the "not set up" note. With settings present and nobody signed in, the home page redirects to `/login`, the login page loads, and `/api/health` stays public. Signing in against a real Supabase project has not been tested yet, so step 5 above is the real test.

## P1-01: starter project

A Next.js (TypeScript) app with a health check at `/api/health`, an automatic check on GitHub for each change (type check and build), and a staging site on Vercel.

## Run it on your own computer (optional)

```
npm install
cp .env.example .env.local
npm run dev
```

Then open http://localhost:3000.

## Checks

```
npm run typecheck
npm run build
```

## Next ticket

P1-03: businesses (workspaces) and memberships, so each person only sees the clients they belong to.
