import "dart:ui";

import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:google_fonts/google_fonts.dart";

import "../theme/app_theme.dart";

enum AppBottomTab { home, gallery, contex }

class AppBottomNavBar extends StatelessWidget {
  const AppBottomNavBar({
    super.key,
    required this.currentTab,
    required this.onTabSelected,
    this.galleryCount,
  });

  final AppBottomTab currentTab;
  final ValueChanged<AppBottomTab> onTabSelected;
  final int? galleryCount;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(28),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              color: AppColors.surfaceElevated.withValues(alpha: 0.55),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.12),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.35),
                  blurRadius: 24,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
              child: Row(
                children: [
                  _NavItem(
                    tab: AppBottomTab.home,
                    currentTab: currentTab,
                    icon: Icons.home_rounded,
                    label: "Home",
                    onTap: onTabSelected,
                  ),
                  _NavItem(
                    tab: AppBottomTab.gallery,
                    currentTab: currentTab,
                    icon: Icons.photo_library_rounded,
                    label: "Gallery",
                    badgeCount: galleryCount ?? 0,
                    onTap: onTabSelected,
                  ),
                  _NavItem(
                    tab: AppBottomTab.contex,
                    currentTab: currentTab,
                    icon: Icons.auto_awesome_rounded,
                    label: "ConteX",
                    onTap: onTabSelected,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.tab,
    required this.currentTab,
    required this.icon,
    required this.label,
    required this.onTap,
    this.badgeCount = 0,
  });

  final AppBottomTab tab;
  final AppBottomTab currentTab;
  final IconData icon;
  final String label;
  final int badgeCount;
  final ValueChanged<AppBottomTab> onTap;

  bool get _isActive => tab == currentTab;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Material(
          type: MaterialType.transparency,
          child: InkWell(
            borderRadius: BorderRadius.circular(20),
            onTap: () {
              if (_isActive) return;
              HapticFeedback.lightImpact();
              onTap(tab);
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 280),
              curve: Curves.easeOutCubic,
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: _isActive
                    ? AppColors.violet.withValues(alpha: 0.2)
                    : Colors.transparent,
                border: Border.all(
                  color: _isActive
                      ? AppColors.violet.withValues(alpha: 0.55)
                      : Colors.transparent,
                ),
                boxShadow: _isActive
                    ? [
                        BoxShadow(
                          color: AppColors.violet.withValues(alpha: 0.3),
                          blurRadius: 16,
                          offset: const Offset(0, 6),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  _IconWithBadge(
                    icon: icon,
                    active: _isActive,
                    badgeCount: badgeCount,
                  ),
                  AnimatedSize(
                    duration: const Duration(milliseconds: 280),
                    curve: Curves.easeOutCubic,
                    child: _isActive
                        ? Padding(
                            padding: const EdgeInsets.only(left: 8),
                            child: Text(
                              label,
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                          )
                        : const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _IconWithBadge extends StatelessWidget {
  const _IconWithBadge({
    required this.icon,
    required this.active,
    required this.badgeCount,
  });

  final IconData icon;
  final bool active;
  final int badgeCount;

  @override
  Widget build(BuildContext context) {
    final color = active ? AppColors.violet : AppColors.textSecondary;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        Icon(icon, color: color, size: 22),
        if (badgeCount > 0)
          Positioned(
            right: -8,
            top: -8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.violet, AppColors.fuchsia],
                ),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppColors.background, width: 1.2),
              ),
              child: Text(
                badgeCount > 99 ? "99+" : "$badgeCount",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 9,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  height: 1,
                ),
              ),
            ),
          ),
      ],
    );
  }
}
