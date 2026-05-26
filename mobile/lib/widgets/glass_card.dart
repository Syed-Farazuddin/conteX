import "package:flutter/material.dart";

import "../theme/app_theme.dart";

class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = 20,
    this.highlight = false,
  });

  final Widget child;
  final EdgeInsets padding;
  final double borderRadius;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: highlight
              ? const Color(0x668B5CF6)
              : AppColors.border,
        ),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: highlight
              ? [
                  const Color(0xFF8B5CF6).withValues(alpha: 0.12),
                  AppColors.surface.withValues(alpha: 0.85),
                ]
              : [
                  Colors.white.withValues(alpha: 0.06),
                  AppColors.surface.withValues(alpha: 0.75),
                ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Padding(padding: padding, child: child),
    );
  }
}
