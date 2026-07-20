# Contributing

## Branching

- `main` — stable, protected, always deployable
- `dev` — integration branch, PRs land here first
- feature/fix work: branch off `dev`, one focused commit per branch, PR back into `dev`
- `dev` → `main` via PR when ready to release

Branch naming: `feature/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.

## Setup

```bash
npm run install:all
cp server/.env.example server/.env
npm run dev
```

## Before opening a PR

```bash
npm run lint
```

Keep commits scoped — one logical change per commit/branch. Write commit messages as `type: what changed` (`feat`, `fix`, `chore`, `docs`, `refactor`).

## Code style

- Server: CommonJS, ESLint config in `server/eslint.config.js`
- Client: React + Vite, linted via `npm run lint --prefix client`

Don't commit `.env`, `node_modules/`, or build output — already covered by `.gitignore`.
