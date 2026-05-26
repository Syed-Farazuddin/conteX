# ConteX Mobile (Flutter)

Same generation API as the web app — pick a style (Natural, Ghibli, Anime, …), upload a photo, generate via Replicate.

## Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install)
- ConteX backend running (`npm run dev` from repo root)

## Run

```bash
cd mobile
flutter pub get
flutter run
```

### API URL

Default: `http://localhost:4000` (works on **iOS Simulator**).

| Target           | `--dart-define`                        |
| ---------------- | -------------------------------------- |
| Android emulator | `API_BASE_URL=http://10.0.2.2:4000`    |
| Physical device  | `API_BASE_URL=http://YOUR_LAN_IP:4000` |

Example:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:4000
```

Add your device URL to `CORS_ORIGIN` in `backend/.env` if needed (comma-separated with `http://localhost:3000`).

## Project layout

```
lib/
  main.dart
  config/api_config.dart
  api/generation_api.dart
  screens/studio_screen.dart
```
