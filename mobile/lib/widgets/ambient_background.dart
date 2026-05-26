import "package:flutter/material.dart";

import "../theme/app_theme.dart";

/// Soft gradient orbs behind content for a premium studio feel.
class AmbientBackground extends StatelessWidget {
  const AmbientBackground({super.key});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Stack(
        fit: StackFit.expand,
        children: [
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF050508),
                  Color(0xFF0A0812),
                  Color(0xFF050508),
                ],
              ),
            ),
          ),
          Positioned(
            top: -80,
            right: -60,
            child: _Orb(
              size: 280,
              colors: [
                AppColors.violet.withValues(alpha: 0.22),
                AppColors.fuchsia.withValues(alpha: 0.08),
              ],
            ),
          ),
          Positioned(
            top: 220,
            left: -100,
            child: _Orb(
              size: 240,
              colors: [
                AppColors.fuchsia.withValues(alpha: 0.14),
                Colors.transparent,
              ],
            ),
          ),
          Positioned(
            bottom: 120,
            right: -40,
            child: _Orb(
              size: 200,
              colors: [
                AppColors.rose.withValues(alpha: 0.1),
                Colors.transparent,
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Orb extends StatelessWidget {
  const _Orb({required this.size, required this.colors});

  final double size;
  final List<Color> colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(colors: colors),
      ),
    );
  }
}
