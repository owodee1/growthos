# GrowthOS

Beyond Limit's sales growth management system. This is ticket P1-01: the starter project.

## What this ticket delivers

- A Next.js (TypeScript) app with a home page and a health check at `/api/health`
- An automatic check on GitHub (type check and build) for every change
- A staging site on Vercel that updates every time `main` changes

Done when: opening the Vercel staging link shows the GrowthOS page, and `/api/health` returns `{"status":"ok"}`.

## One-time setup (owner does this with their own accounts)

1. **GitHub.** Create a free account, then a new private repository called `growthos`. Upload the contents of this folder to it (not the folder itself, and not `node_modules`).
2. **Vercel.** Sign up with the GitHub account. Choose Add New Project, pick the `growthos` repository and click Deploy. Under Project Settings > Environment Variables add `NEXT_PUBLIC_APP_ENV` with the value `staging`, then redeploy.
3. **Supabase.** Create a free account and a project named `growthos`, in the region closest to your users. Keep the project URL and keys private. They are used from ticket P1-02 onward.

Use the owner's email on all three accounts, and turn on two-step sign-in for each.

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

P1-02: sign-in with email or phone code, using Supabase.
