import "package:flutter/material.dart";

import "../models/generation_session.dart";
import "../screens/gallery_screen.dart";
import "../screens/image_viewer_screen.dart";
import "../screens/landing_screen.dart";
import "../screens/result_screen.dart";
import "../screens/splash_screen.dart";
import "../screens/studio_screen.dart";

abstract final class AppRoutes {
  static const splash = "/";
  static const landing = "/home";
  static const studio = "/studio";
  static const gallery = "/gallery";
  static const result = "/result";
  static const imageViewer = "/viewer";

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return _fade(const SplashScreen(), settings);
      case landing:
        return _fade(const LandingScreen(), settings);
      case studio:
        return _slide(const StudioScreen(), settings);
      case gallery:
        return _slide(const GalleryScreen(), settings);
      case result:
        final session = settings.arguments;
        if (session is! GenerationSession) {
          return _fade(const LandingScreen(), settings);
        }
        return _slide(ResultScreen(session: session), settings);
      case imageViewer:
        final args = settings.arguments;
        if (args is! ImageViewerArgs) {
          return _fade(const LandingScreen(), settings);
        }
        return _slide(ImageViewerScreen(args: args), settings);
      default:
        return _fade(const LandingScreen(), settings);
    }
  }

  static PageRoute<T> _slide<T>(Widget page, RouteSettings settings) {
    return PageRouteBuilder<T>(
      settings: settings,
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, __, child) {
        final offset = Tween<Offset>(
          begin: const Offset(0.06, 0),
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic));
        return FadeTransition(
          opacity: animation,
          child: SlideTransition(position: offset, child: child),
        );
      },
      transitionDuration: const Duration(milliseconds: 320),
    );
  }

  static PageRoute<T> _fade<T>(Widget page, RouteSettings settings) {
    return PageRouteBuilder<T>(
      settings: settings,
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, __, child) =>
          FadeTransition(opacity: animation, child: child),
      transitionDuration: const Duration(milliseconds: 280),
    );
  }
}
