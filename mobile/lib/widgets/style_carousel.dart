import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:google_fonts/google_fonts.dart";

import "../api/generation_api.dart";
import "../theme/app_theme.dart";

class StyleCarousel extends StatelessWidget {
  const StyleCarousel({
    super.key,
    required this.styles,
    required this.selectedId,
    required this.onSelected,
    this.disabled = false,
    this.loading = false,
  });

  final List<GenerationStyle> styles;
  final String selectedId;
  final ValueChanged<String> onSelected;
  final bool disabled;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    if (loading && styles.isEmpty) {
      return SizedBox(
        height: 118,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 4),
          itemCount: 4,
          separatorBuilder: (_, __) => const SizedBox(width: 10),
          itemBuilder: (_, __) => const _StyleSkeleton(),
        ),
      );
    }

    return SizedBox(
      height: 124,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 2),
        itemCount: styles.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          final style = styles[index];
          final selected = style.id == selectedId;
          return _StyleChip(
            style: style,
            selected: selected,
            disabled: disabled,
            onTap: () {
              HapticFeedback.selectionClick();
              onSelected(style.id);
            },
          );
        },
      ),
    );
  }
}

class _StyleChip extends StatelessWidget {
  const _StyleChip({
    required this.style,
    required this.selected,
    required this.disabled,
    required this.onTap,
  });

  final GenerationStyle style;
  final bool selected;
  final bool disabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      width: 148,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: disabled ? null : onTap,
          borderRadius: BorderRadius.circular(18),
          child: Ink(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              border: Border.all(
                color: selected ? const Color(0x99A78BFA) : AppColors.border,
                width: selected ? 1.5 : 1,
              ),
              gradient: selected
                  ? const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0x338B5CF6), Color(0x1AD946EF)],
                    )
                  : LinearGradient(
                      colors: [
                        Colors.white.withValues(alpha: 0.05),
                        AppColors.surface.withValues(alpha: 0.5),
                      ],
                    ),
              boxShadow: selected
                  ? [
                      BoxShadow(
                        color: AppColors.violet.withValues(alpha: 0.25),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ]
                  : null,
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(style.emoji, style: const TextStyle(fontSize: 26)),
                  const Spacer(),
                  Text(
                    style.label,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    style.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 10,
                      height: 1.25,
                      color: AppColors.textMuted,
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

class _StyleSkeleton extends StatelessWidget {
  const _StyleSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 148,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: AppColors.surface.withValues(alpha: 0.6),
        border: Border.all(color: AppColors.border),
      ),
    );
  }
}
