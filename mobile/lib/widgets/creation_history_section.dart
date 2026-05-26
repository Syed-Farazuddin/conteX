import "dart:io";

import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:google_fonts/google_fonts.dart";

import "../app/app_routes.dart";
import "../models/generation_session.dart";
import "../models/saved_creation.dart";
import "../theme/app_theme.dart";

class CreationHistorySection extends StatelessWidget {
  const CreationHistorySection({
    super.key,
    required this.creations,
    this.onSeeAll,
    this.onDelete,
  });

  final List<SavedCreation> creations;
  final VoidCallback? onSeeAll;
  final Future<void> Function(SavedCreation item)? onDelete;

  void _openCreation(BuildContext context, SavedCreation item) {
    HapticFeedback.selectionClick();
    Navigator.of(
      context,
    ).pushNamed(AppRoutes.result, arguments: GenerationSession.fromSaved(item));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                "YOUR CREATIONS",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.4,
                  color: AppColors.textMuted,
                ),
              ),
            ),
            if (creations.isNotEmpty) ...[
              if (onDelete != null)
                Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: Text(
                    "Long press to delete",
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 11,
                      color: AppColors.textMuted,
                    ),
                  ),
                ),
              if (onSeeAll != null)
                TextButton(
                  onPressed: onSeeAll,
                  child: Text(
                    "See all",
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFFC4B5FD),
                    ),
                  ),
                ),
            ],
          ],
        ),
        const SizedBox(height: 14),
        if (creations.isEmpty)
          _EmptyHistoryCard(
            onCreate: () => Navigator.of(context).pushNamed(AppRoutes.studio),
          )
        else
          SizedBox(
            height: 220,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: creations.length > 6 ? 6 : creations.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final item = creations[index];
                return _HistoryCard(
                  creation: item,
                  onTap: () => _openCreation(context, item),
                  onLongPress: onDelete == null
                      ? null
                      : () async {
                          HapticFeedback.mediumImpact();
                          await onDelete!(item);
                        },
                );
              },
            ),
          ),
      ],
    );
  }
}

class _EmptyHistoryCard extends StatelessWidget {
  const _EmptyHistoryCard({required this.onCreate});

  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        gradient: LinearGradient(
          colors: [
            AppColors.violet.withValues(alpha: 0.08),
            AppColors.surface.withValues(alpha: 0.6),
          ],
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.collections_outlined,
            size: 40,
            color: AppColors.violet.withValues(alpha: 0.7),
          ),
          const SizedBox(height: 12),
          Text(
            "Your gallery is empty",
            style: GoogleFonts.plusJakartaSans(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            "After you generate, originals and results are saved on this device.",
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              height: 1.4,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onCreate,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textPrimary,
                    side: const BorderSide(color: AppColors.borderStrong),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    "Create first",
                    style: GoogleFonts.plusJakartaSans(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  const _HistoryCard({
    required this.creation,
    required this.onTap,
    this.onLongPress,
  });

  final SavedCreation creation;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  String get _dateLabel {
    try {
      final dt = DateTime.parse(creation.createdAt).toLocal();
      final h = dt.hour.toString().padLeft(2, "0");
      final m = dt.minute.toString().padLeft(2, "0");
      return "${dt.month}/${dt.day} · $h:$m";
    } catch (_) {
      return "";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          width: 160,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(19),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.file(
                        File(creation.outputPath),
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: AppColors.surface,
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.broken_image_outlined,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ),
                      Positioned(
                        left: 8,
                        top: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.55),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                creation.styleEmoji,
                                style: const TextStyle(fontSize: 12),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                creation.styleLabel,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: Colors.white,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
                  color: AppColors.surface.withValues(alpha: 0.95),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        creation.styleLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      if (_dateLabel.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          _dateLabel,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 10,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
