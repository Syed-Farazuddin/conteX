import "package:flutter/material.dart";
import "package:google_fonts/google_fonts.dart";

import "../theme/app_theme.dart";

enum PrimaryButtonVariant { gradient, outline }

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.loading = false,
    this.enabled = true,
    this.variant = PrimaryButtonVariant.gradient,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool loading;
  final bool enabled;
  final PrimaryButtonVariant variant;

  @override
  Widget build(BuildContext context) {
    final active = enabled && !loading && onPressed != null;
    final isGradient = variant == PrimaryButtonVariant.gradient;

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: isGradient && active
            ? const LinearGradient(
                colors: [AppColors.violet, AppColors.fuchsia],
              )
            : null,
        color: isGradient
            ? (active ? null : AppColors.surfaceElevated)
            : Colors.transparent,
        border: isGradient
            ? null
            : Border.all(
                color: active ? AppColors.borderStrong : AppColors.border,
              ),
        boxShadow: isGradient && active
            ? [
                BoxShadow(
                  color: AppColors.violet.withValues(alpha: 0.4),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: active ? onPressed : null,
          borderRadius: BorderRadius.circular(18),
          child: SizedBox(
            width: double.infinity,
            height: 56,
            child: Center(
              child: loading
                  ? SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.5,
                        color: isGradient ? Colors.white : AppColors.violet,
                      ),
                    )
                  : Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (icon != null) ...[
                          Icon(
                            icon,
                            size: 20,
                            color: active
                                ? (isGradient
                                    ? Colors.white
                                    : AppColors.textPrimary)
                                : AppColors.textMuted,
                          ),
                          const SizedBox(width: 10),
                        ],
                        Text(
                          label,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: active
                                ? (isGradient
                                    ? Colors.white
                                    : AppColors.textPrimary)
                                : AppColors.textMuted,
                          ),
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
