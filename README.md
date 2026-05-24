# ConteX

Monorepo with a Next.js + Tailwind frontend and an Express backend scaffold.

## Frontend

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Backend (structure only)

```bash
cd backend
npm install
npm run dev
```

## Run both (from repo root)

**Terminal:**

```bash
npm install
npm run dev
```

**Cursor / VS Code:** `Terminal` → `Run Task…`

| Task            | What it does                                          |
| --------------- | ----------------------------------------------------- |
| `dev: all`      | Backend + frontend (default build task)               |
| `backend: dev`  | API on [http://localhost:4000](http://localhost:4000) |
| `frontend: dev` | App on [http://localhost:3000](http://localhost:3000) |

Shortcut: `Cmd+Shift+B` (Mac) or `Ctrl+Shift+B` (Windows/Linux) runs **`dev: all`**.

- `GET /health` — health check
- `POST /api/upload` — stub upload endpoint (returns `{ message: "Photo received" }`)
- `GET /api/ai/status` — check if `OPEN_AI_API_KEY` is configured
- `POST /api/ai/plan-pipeline` — vision AI returns ordered `{ summary, actions[] }` for the image
- `POST /api/ai/chat` — OpenAI chat (`{ "prompt": "..." }` or `{ "messages": [...] }`)

Copy `backend/.env.example` to `backend/.env` and set `OPEN_AI_API_KEY`.

Wire the frontend to `POST /api/upload` when you are ready to persist uploads.

### Photo actions

Actions are registered in a map (`key` → handler). Each action defines what runs on process.

| Layer    | Location                                                      |
| -------- | ------------------------------------------------------------- |
| Frontend | `frontend/src/lib/actions/` — `runPhotoAction(key, imageUrl)` |
| Backend  | `backend/src/actions/` — `runAction(key, payload)` (stubs)    |

**`clear-background`** — removes the background in the browser via `@imgly/background-removal` (first run downloads ML models).

**`add-background`** — runs `backgroundAdder`: clear background, random scene from `constant.ts`, place subject using `position: { top, left, right, bottom }` (% insets).

**Video / frame actions:** `crop-16-9`, `crop-9-16`, `crop-1-1`, `resize-1080p`, `resize-vertical`, `adjust-enhance`, `rotate-90`, `flip-horizontal`.

Each action supports `defaultParams` in the map; overrides are merged at runtime via `runPhotoAction(key, url, params)`.

To add a new action: create `your-action.ts`, register in `actions/index.ts`, extend `ActionKey`, and add a backend stub in `backend/src/actions/`.
