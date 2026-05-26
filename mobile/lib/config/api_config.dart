import "dart:io";

import "package:flutter_dotenv/flutter_dotenv.dart";

/// Backend base URL (same role as web `NEXT_PUBLIC_API_URL`).
///
/// Resolution order:
/// 1. `--dart-define=API_BASE_URL=...`
/// 2. `API_BASE_URL` in `mobile/.env`
/// 3. Platform default (iOS sim / macOS → localhost; Android emulator → 10.0.2.2)
String resolveApiBaseUrl() {
  const fromDefine = String.fromEnvironment("API_BASE_URL");
  if (fromDefine.isNotEmpty) return fromDefine;

  final fromEnv = dotenv.env["API_BASE_URL"]?.trim();
  if (fromEnv != null && fromEnv.isNotEmpty) return fromEnv;

  if (Platform.isAndroid) return "http://10.0.2.2:4000";
  return "http://localhost:4000";
}

late String apiBaseUrl;
