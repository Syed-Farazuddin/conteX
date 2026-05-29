import "dart:io";

import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:google_fonts/google_fonts.dart";

import "../services/image_download_service.dart";
import "../theme/app_theme.dart";
import "app_snackbar.dart";

/// Full-screen image preview as an in-place popup (not a new route).
Future<void> showImagePreviewDialog(
  BuildContext context, {
  required String? localPath,
  required String remoteUrl,
  required String title,
  String? subtitle,
}) {
  return showGeneralDialog<void>(
    context: context,
    barrierDismissible: true,
    barrierLabel: "Close full screen",
    barrierColor: Colors.black.withValues(alpha: 0.88),
    transitionDuration: const Duration(milliseconds: 220),
    pageBuilder: (dialogContext, _, __) {
      return _ImagePreviewDialog(
        localPath: localPath,
        remoteUrl: remoteUrl,
        title: title,
        subtitle: subtitle,
      );
    },
    transitionBuilder: (_, animation, __, child) {
      return FadeTransition(
        opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
        child: ScaleTransition(
          scale: Tween<double>(begin: 0.96, end: 1).animate(
            CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
          ),
          child: child,
        ),
      );
    },
  );
}

class _ImagePreviewDialog extends StatefulWidget {
  const _ImagePreviewDialog({
    required this.localPath,
    required this.remoteUrl,
    required this.title,
    this.subtitle,
  });

  final String? localPath;
  final String remoteUrl;
  final String title;
  final String? subtitle;

  @override
  State<_ImagePreviewDialog> createState() => _ImagePreviewDialogState();
}

class _ImagePreviewDialogState extends State<_ImagePreviewDialog> {
  final _downloadService = ImageDownloadService();
  bool _downloading = false;

  @override
  void dispose() {
    _downloadService.dispose();
    super.dispose();
  }

  Future<void> _download() async {
    if (_downloading) return;
    HapticFeedback.mediumImpact();
    setState(() => _downloading = true);
    try {
      await _downloadService.saveOutput(
        localPath: widget.localPath,
        remoteUrl: widget.remoteUrl,
      );
      if (!mounted) return;
      AppSnackBar.show(context, "Saved to your photo library");
    } on ImageDownloadException catch (e) {
      if (!mounted) return;
      AppSnackBar.show(context, e.message);
    } catch (_) {
      if (!mounted) return;
      AppSnackBar.show(context, "Could not save image");
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }

  Widget _buildImage() {
    final local = widget.localPath;
    if (local != null && File(local).existsSync()) {
      return Image.file(File(local), fit: BoxFit.contain);
    }
    return Image.network(
      widget.remoteUrl,
      fit: BoxFit.contain,
      loadingBuilder: (_, child, progress) {
        if (progress == null) return child;
        return const Center(
          child: CircularProgressIndicator(
            color: AppColors.violet,
            strokeWidth: 2,
          ),
        );
      },
      errorBuilder: (_, __, ___) => Center(
        child: Text(
          "Could not load image",
          style: GoogleFonts.plusJakartaSans(color: AppColors.textMuted),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        if (widget.subtitle != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            widget.subtitle!,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 12,
                              color: Colors.white70,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _downloading ? null : _download,
                    icon: _downloading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(
                            Icons.download_rounded,
                            color: Colors.white,
                          ),
                    tooltip: "Save to Photos",
                  ),
                  const SizedBox(width: 4),
                  TextButton.icon(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(
                      Icons.close_rounded,
                      size: 18,
                      color: Colors.white,
                    ),
                    label: Text(
                      "Close",
                      style: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    style: TextButton.styleFrom(
                      backgroundColor: Colors.white.withValues(alpha: 0.12),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: Container(
                    width: double.infinity,
                    color: AppColors.surface.withValues(alpha: 0.35),
                    child: InteractiveViewer(
                      minScale: 0.5,
                      maxScale: 4,
                      child: Center(child: _buildImage()),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
