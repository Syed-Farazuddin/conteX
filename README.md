# ConteX

Monorepo with a Next.js + Tailwind frontend and an Express backend scaffold.

## Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Upload a photo, then click **Send photo** to see the **Photo Received** confirmation.

## Backend (structure only)

```bash
cd backend
npm install
npm run dev
```

- `GET /health` — health check
- `POST /api/upload` — stub upload endpoint (returns `{ message: "Photo received" }`)

Wire the frontend to `POST /api/upload` when you are ready to persist uploads.
