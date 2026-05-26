# ConteX

AI photo generation for **web** and **mobile** — pick a style (Natural, Ghibli, Anime, Cinematic, and more), upload a photo, and generate via Replicate.

Monorepo: Next.js frontend, Express API, Flutter mobile app.

## Quick start

```bash
npm install
cd backend && cp .env.example .env   # add REPLICATE_API_TOKEN, OPEN_AI_API_KEY
cd ../frontend && npm install
cd ../mobile && flutter pub get
```

From repo root:

```bash
npm run dev          # backend + web
npm run dev:mobile   # Flutter (separate terminal, or use dev:all)
```

| URL                                            | App                           |
| ---------------------------------------------- | ----------------------------- |
| [http://localhost:3000](http://localhost:3000) | Web studio                    |
| [http://localhost:4000](http://localhost:4000) | API                           |
| `flutter run`                                  | Mobile (`npm run dev:mobile`) |

## Photo generation API

| Method | Path                   | Description                                             |
| ------ | ---------------------- | ------------------------------------------------------- |
| `GET`  | `/api/generate/styles` | List styles (`natural`, `ghibli`, `anime`, …)           |
| `POST` | `/api/generate`        | Body: `{ styleId, imageBase64, prompt?, aspectRatio? }` |

Styles are defined in `backend/src/constants/generation-styles.ts`.

## Mobile app

```bash
cd mobile
flutter pub get
# Physical device:
flutter run --dart-define=API_BASE_URL=http://YOUR_LAN_IP:4000
```

Add your LAN IP to `CORS_ORIGIN` in `backend/.env` (comma-separated with `http://localhost:3000`).

## Legacy browser tools (disabled)

Crop, clear background, AI auto-edit pipeline, and manual tools remain in `frontend/src/lib/actions/` but are **hidden** by default.

To re-enable the old studio UI:

```ts
// frontend/src/lib/config/features.ts
export const ENABLE_LEGACY_TOOLS = true;
```

## Environment

See `backend/.env.example` for Replicate model pins, CORS, and OpenAI keys.

- `REPLICATE_GENERATION_MODEL` — flux-kontext-pro (image + prompt)
- `REPLICATE_CLOTHING_MODEL` — fashion model style preset

## Project layout

```
backend/     Express API, generation + clothing services
frontend/    Next.js web app
mobile/      Flutter (iOS / Android)
```
