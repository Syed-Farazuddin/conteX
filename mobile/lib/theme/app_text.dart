import "package:flutter/material.dart";

import "app_theme.dart";

/// Typography from [ThemeData] (preloaded in main) — avoids per-widget GoogleFonts calls.
abstract final class AppText {
  static TextStyle label(BuildContext context) =>
      Theme.of(context).textTheme.labelSmall!.copyWith(
        fontWeight: FontWeight.w700,
        letterSpacing: 1.2,
        color: AppColors.textMuted,
      );

  static TextStyle title(BuildContext context, {double size = 16}) =>
      Theme.of(context).textTheme.titleMedium!.copyWith(
        fontSize: size,
        fontWeight: FontWeight.w700,
        color: AppColors.textPrimary,
      );

  static TextStyle body(
    BuildContext context, {
    double size = 14,
    Color? color,
    double? height,
  }) => Theme.of(context).textTheme.bodyMedium!.copyWith(
    fontSize: size,
    height: height,
    color: color ?? AppColors.textSecondary,
  );

  static TextStyle caption(BuildContext context, {Color? color}) =>
      Theme.of(context).textTheme.bodySmall!.copyWith(
        fontSize: 11,
        color: color ?? AppColors.textMuted,
      );
}
