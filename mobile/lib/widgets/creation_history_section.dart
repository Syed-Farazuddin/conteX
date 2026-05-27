import "dart:io";

import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:google_fonts/google_fonts.dart";

import "../app/app_routes.dart";
import "../models/generation_session.dart";
import "../models/saved_creation.dart";
import "../theme/app_theme.dart";
import "../services/deletion_hint_storage.dart";

class CreationHistorySection extends StatefulWidget {
  const CreationHistorySection({
    super.key,
    required this.creations,
    this.onSeeAll,
    this.onDelete,
    this.onCreateMore,
  });

  final List<SavedCreation> creations;
  final VoidCallback? onSeeAll;
  final Future<void> Function(SavedCreation item)? onDelete;
  final VoidCallback? onCreateMore;

  void _openCreation(BuildContext context, SavedCreation item) {
    HapticFeedback.selectionClick();
    Navigator.of(
      context,
    ).pushNamed(AppRoutes.result, arguments: GenerationSession.fromSaved(item));
  }

  @override
  State<CreationHistorySection> createState() => _CreationHistorySectionState();
}

class _CreationHistorySectionState extends State<CreationHistorySection> {
  bool? _hintSeen;
  bool _queuedMarkSeen = false;

  @override
  void initState() {
    super.initState();
    DeletionHintStorage.hasSeen().then((v) {
      if (!mounted) return;
      setState(() => _hintSeen = v);
    });
  }

  @override
  Widget build(BuildContext context) {
    final creations = widget.creations;
    final onDelete = widget.onDelete;
    final onSeeAll = widget.onSeeAll;

    final shouldShowDeleteHint =
        creations.isNotEmpty && onDelete != null && _hintSeen == false;

    if (shouldShowDeleteHint && !_queuedMarkSeen) {
      _queuedMarkSeen = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        DeletionHintStorage.markSeen();
      });
    }

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
              if (shouldShowDeleteHint)
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
              itemCount: _historyRowItemCount(
                creations.length,
                showCreateMore: widget.onCreateMore != null,
              ),
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                if (widget.onCreateMore != null && index == 0) {
                  return _CreateMoreCard(onTap: widget.onCreateMore!);
                }
                final creationIndex =
                    widget.onCreateMore != null ? index - 1 : index;
                final item = creations[creationIndex];
                return _HistoryCard(
                  creation: item,
                  onTap: () => widget._openCreation(context, item),
                  onLongPress: onDelete == null
                      ? null
                      : () async {
                          HapticFeedback.mediumImpact();
                          await onDelete(item);
                        },
                );
              },
            ),
          ),
      ],
    );
  }
}

int _historyRowItemCount(int creationCount, {required bool showCreateMore}) {
  final shown = creationCount > 6 ? 6 : creationCount;
  return shown + (showCreateMore ? 1 : 0);
}

class _CreateMoreCard extends StatelessWidget {
  const _CreateMoreCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          onTap();
        },
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          width: 160,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: AppColors.violet.withValues(alpha: 0.4),
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.violet.withValues(alpha: 0.12),
                blurRadius: 16,
                offset: const Offset(0, 8),
              ),
            ],
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.violet.withValues(alpha: 0.14),
                AppColors.surface.withValues(alpha: 0.85),
              ],
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(19),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.violet.withValues(alpha: 0.18),
                            border: Border.all(
                              color: AppColors.violet.withValues(alpha: 0.45),
                            ),
                          ),
                          child: const Icon(
                            Icons.add_rounded,
                            color: AppColors.violet,
                            size: 28,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          "Create more",
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            "Tap to open the studio",
                            textAlign: TextAlign.center,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              height: 1.3,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.fromLTRB(10, 10, 10, 12),
                  color: AppColors.surface.withValues(alpha: 0.95),
                  child: Text(
                    "New transformation",
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
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
