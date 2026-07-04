import "package:flutter/material.dart";
import "package:flutter_dotenv/flutter_dotenv.dart";
import "package:google_fonts/google_fonts.dart";

import "app/app_routes.dart";
import "app/route_observer.dart";
import "config/api_config.dart";
import "services/auth_service.dart";
import "theme/app_theme.dart";

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  AppTheme.applySystemUi();

  // Cache Plus Jakarta Sans before first frame (needs network once, then cached).
  try {
    await GoogleFonts.pendingFonts([
      GoogleFonts.plusJakartaSans(),
      GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w600),
      GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
      GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w800),
    ]);
  } catch (e) {
    debugPrint("Font preload skipped: $e");
  }

  await dotenv.load(fileName: ".env.example");
  await dotenv.load(fileName: ".env", isOptional: true);
  apiBaseUrl = resolveApiBaseUrl();

  // Restore any saved org session (best-effort; failures fall back to logged-out).
  try {
    await AuthService.instance.restore();
  } catch (_) {}

  runApp(const ConteXApp());
}

class ConteXApp extends StatelessWidget {
  const ConteXApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "ConteX",
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      initialRoute: AppRoutes.splash,
      onGenerateRoute: AppRoutes.onGenerateRoute,
      navigatorObservers: [appRouteObserver],
    );
  }
}
