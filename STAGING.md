# Staging environment

A separate, isolated environment for testing without touching production data.

## What's different from main

- **Database** — points at a separate Supabase project (`ppopphaomwocrmzzawnt`),
  not the live one. Adding, editing, or deleting species here will **not**
  affect the production database.
- **Deployed URL** — https://ashishm1999.github.io/flora-collector/staging/
- **Source branch** — `staging`. Push to `staging` and the staging deploy
  workflow rebuilds and republishes automatically.

## Local development

```bash
git checkout staging
npm install
npm run dev:staging
```

`npm run dev:staging` reads from `.env.staging` (committed) instead of `.env`,
so your local dev hits the staging Supabase project.

## Building / previewing locally

```bash
npm run build:staging     # builds with base path /flora-collector/staging/
npm run preview:staging   # serves the staging build
```

## Deployment

`.github/workflows/deploy-staging.yml` runs on every push to `staging` and
on manual dispatch. It builds with `VITE_BASE_PATH=/flora-collector/staging/`
and publishes to the `gh-pages` branch under the `staging/` subdirectory
(`keep_files: true` so it never wipes the production site).

The deploy reads `STAGING_SUPABASE_URL` and `STAGING_SUPABASE_ANON_KEY` from
GitHub repository secrets.

## Keeping main and staging in sync

Standard pattern:

```bash
git checkout staging
git merge main
git push origin staging
```

The staging branch should generally track main with whatever extra unmerged
features you're testing.
