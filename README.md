
# Crypto Exchange Platform

Monorepo for a simple crypto exchange prototype with separate Backend and Frontend applications.

Overview
- Backend: Node/Express API with authentication, trading primitives, and a WebSocket layer for realtime updates. See [Backend/README.md](Backend/README.md).
- Frontend: Vite + React/TypeScript SPA that talks to the Backend API and displays markets, orders, and user profile pages. See `Frontend` for sources and scripts.

Quick Features
- JWT auth, role seeding, and auth routes
- REST endpoints for user/trade operations
- WebSocket socket server for realtime orderbook/notifications
- Frontend UI components, pages, and WebSocket client

Prerequisites
- Node.js 18+ and npm (or pnpm/yarn)
- Docker (optional, for containerized development)

Run Backend (development)

```bash
cd Backend
npm install
# create .env with required variables (see Environment Variables below)
npm run dev
```

Run Frontend (development)

```bash
cd Frontend
npm install
npm run dev
```

Build Frontend for production

```bash
cd Frontend
npm run build
```

Run Backend with Docker (dev image)

```bash
cd Backend
docker build -f Dockerfile.dev -t crypto-backend:dev .
docker run --env-file .env -p 4000:4000 crypto-backend:dev
```

Environment Variables (examples)
- Backend: PORT, DB_URL, JWT_SECRET
- Frontend: VITE_API_URL (point to Backend API)

Repository layout (top-level)
- Backend/ — server code and DB schema. See [Backend/README.md](Backend/README.md)
- Frontend/ — Vite + React/TypeScript application
- README.md — this file

Key files
- [Backend/README.md](Backend/README.md) — Backend developer notes and setup
- [Frontend/package.json](Frontend/package.json) — Frontend scripts and dependencies

Next steps / Recommendations
- Add a `.env.example` at the root or in `Backend/` documenting required variables.
- Add API docs (OpenAPI/Swagger) for public endpoints.
- Add a CI workflow to run tests and linting for both packages.
- Consider a `docker-compose.yml` to run Backend + Frontend + DB together.

Contributing
- Fork, create a feature branch, run tests, open a PR.

License
- Add your license here (e.g., MIT).


