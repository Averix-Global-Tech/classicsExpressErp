# AGT Classics Express ERP

ERP system for Classic Express International Courier — monorepo with an Express/MongoDB API and a React/Vite client.

## Stack

- **Server** — Node.js, Express, MongoDB (Mongoose), JWT auth, Cloudinary uploads
- **Client** — React, Vite, Tailwind CSS, React Router, React Hook Form

## Project structure

```
client/    React + Vite frontend
server/    Express API
```

## Getting started

```bash
npm run install:all      # install client + server deps

cp server/.env.example server/.env
# fill in MongoDB URI, JWT secrets, etc.

npm run dev               # runs server + client together
```

Other scripts (from repo root):

| Script            | Description                          |
|-------------------|---------------------------------------|
| `npm run dev:server` | Run API only (nodemon)             |
| `npm run dev:client` | Run client only (Vite)             |
| `npm run build`      | Build client for production        |
| `npm run seed`       | Seed default admin user            |
| `npm run lint`       | Lint client + server                |

## Branching

- `main` — stable, protected
- `dev` — integration branch
- feature/fix branches off `dev`, PR back into `dev`, then `dev` → `main`


## Classics ERP SSH Configuration Done