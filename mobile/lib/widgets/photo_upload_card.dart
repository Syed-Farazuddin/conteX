import "dart:io";
import "dart:typed_data";

import "package:flutter/material.dart";
import "package:google_fonts/google_fonts.dart";

import "../api/generation_api.dart";
import "../theme/app_theme.dart";
import "glass_card.dart";

class PhotoUploadCard extends StatelessWidget {
  const PhotoUploadCard({
    super.key,
    required this.imagePath,
    this.imageBytes,
    required this.selectedStyle,
    required this.onTap,
    this.disabled = false,
  });

  final String? imagePath;
  final Uint8List? imageBytes;
  final GenerationStyle? selectedStyle;
  final VoidCallback onTap;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    final hasImage = imagePath != null;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: disabled ? null : onTap,
        borderRadius: BorderRadius.circular(24),
        child: GlassCard(
          padding: EdgeInsets.zero,
          borderRadius: 24,
          highlight: hasImage,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 280),
            child: hasImage
                ? _ImagePreview(
                    key: ValueKey(imagePath),
                    path: imagePath!,
                    bytes: imageBytes,
                  )
                : _EmptyState(
                    key: const ValueKey("empty"),
                    styleLabel: selectedStyle?.label,
                  ),
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({super.key, this.styleLabel});

  final String? styleLabel;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  AppColors.violet.withValues(alpha: 0.35),
                  AppColors.fuchsia.withValues(alpha: 0.2),
                ],
              ),
              border: Border.all(color: const Color(0x33FFFFFF)),
            ),
            child: const Icon(
              Icons.add_photo_alternate_outlined,
              size: 30,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 18),
          Text(
            "Add your photo",
            style: GoogleFonts.plusJakartaSans(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            styleLabel != null
                ? "We'll transform it in $styleLabel style"
                : "Choose a style, then tap to upload",
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              color: AppColors.textSecondary,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: AppColors.borderStrong),
              color: Colors.white.withValues(alpha: 0.04),
            ),
            child: Text(
              "Tap to open gallery",
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ImagePreview extends StatelessWidget {
  const _ImagePreview({super.key, required this.path, this.bytes});

  final String path;
  final Uint8List? bytes;

  /// Portrait-friendly frame; image uses [BoxFit.contain] so nothing is cropped.
  static const _aspectRatio = 3 / 4;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: _aspectRatio,
      child: Stack(
        fit: StackFit.expand,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(23),
            child: ColoredBox(
              color: const Color(0xFF08080C),
              child: Center(
                child: _PreviewImage(path: path, bytes: bytes),
              ),
            ),
          ),
          Positioned(left: 12, top: 12, child: _Badge(label: "Original")),
          Positioned(
            right: 12,
            bottom: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.55),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: AppColors.borderStrong),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.swap_horiz_rounded,
                    size: 16,
                    color: Colors.white,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    "Change",
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PreviewImage extends StatelessWidget {
  const _PreviewImage({required this.path, this.bytes});

  final String path;
  final Uint8List? bytes;

  @override
  Widget build(BuildContext context) {
    final frame = bytes != null && bytes!.isNotEmpty
        ? Image.memory(
            bytes!,
            fit: BoxFit.contain,
            width: double.infinity,
            height: double.infinity,
            gaplessPlayback: true,
            filterQuality: FilterQuality.high,
            errorBuilder: (_, __, ___) => _fileFallback(),
          )
        : _fileFallback();

    return frame;
  }

  Widget _fileFallback() {
    return Image.file(
      File(path),
      fit: BoxFit.contain,
      width: double.infinity,
      height: double.infinity,
      filterQuality: FilterQuality.high,
      errorBuilder: (_, __, ___) => const Icon(
        Icons.broken_image_outlined,
        size: 48,
        color: AppColors.textMuted,
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.borderStrong),
      ),
      child: Text(
        label,
        style: GoogleFonts.plusJakartaSans(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}
