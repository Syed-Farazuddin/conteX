import "package:flutter/material.dart";
import "package:google_fonts/google_fonts.dart";

import "../theme/app_theme.dart";

/// Snack bars with readable text on the dark app theme.
abstract final class AppSnackBar {
  static void show(
    BuildContext context,
    String message, {
    SnackBarAction? action,
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: GoogleFonts.plusJakartaSans(
            color: AppColors.textPrimary,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: AppColors.surfaceElevated,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        action: action,
      ),
    );
  }
}
