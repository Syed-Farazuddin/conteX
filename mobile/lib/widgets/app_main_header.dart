import "package:flutter/material.dart";
import "package:google_fonts/google_fonts.dart";

import "../theme/app_theme.dart";
import "app_bottom_nav_bar.dart";
import "app_logo.dart";

/// Shared top bar for Home, Gallery, and ConteX tab screens.
class AppMainHeader extends StatelessWidget {
  const AppMainHeader({
    super.key,
    required this.tab,
    this.galleryCount,
  });

  final AppBottomTab tab;
  final int? galleryCount;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 10),
      child: Row(
        children: [
          const AppLogo.wordmark(height: 44, maxWidth: 200),
          const Spacer(),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, animation) {
              return FadeTransition(
                opacity: animation,
                child: ScaleTransition(
                  scale: Tween<double>(begin: 0.92, end: 1).animate(animation),
                  child: child,
                ),
              );
            },
            child: _TrailingForTab(
              key: ValueKey(tab),
              tab: tab,
              galleryCount: galleryCount,
            ),
          ),
        ],
      ),
    );
  }
}

class _TrailingForTab extends StatelessWidget {
  const _TrailingForTab({
    super.key,
    required this.tab,
    this.galleryCount,
  });

  final AppBottomTab tab;
  final int? galleryCount;

  @override
  Widget build(BuildContext context) {
    switch (tab) {
      case AppBottomTab.home:
        return const SizedBox(width: 1, height: 1);
      case AppBottomTab.gallery:
        final count = galleryCount ?? 0;
        if (count > 0) {
          return _HeaderPill(
            label: "$count saved",
            icon: Icons.photo_library_rounded,
          );
        }
        return const _HeaderPill(label: "Gallery");
      case AppBottomTab.contex:
        return const _HeaderPill(label: "What we do");
    }
  }
}

class _HeaderPill extends StatelessWidget {
  const _HeaderPill({required this.label, this.icon});

  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: AppColors.surfaceElevated.withValues(alpha: 0.7),
        border: Border.all(color: AppColors.borderStrong),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 14, color: AppColors.violet),
            const SizedBox(width: 6),
          ],
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontWeight: FontWeight.w700,
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
