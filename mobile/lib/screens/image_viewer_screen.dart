import "dart:io";

import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:google_fonts/google_fonts.dart";

import "../services/image_download_service.dart";
import "../theme/app_theme.dart";
import "../widgets/app_snackbar.dart";

class ImageViewerArgs {
  const ImageViewerArgs({
    required this.imageUrl,
    required this.title,
    this.localPath,
    this.subtitle,
  });

  final String imageUrl;
  final String? localPath;
  final String title;
  final String? subtitle;
}

class ImageViewerScreen extends StatefulWidget {
  const ImageViewerScreen({super.key, required this.args});

  final ImageViewerArgs args;

  @override
  State<ImageViewerScreen> createState() => _ImageViewerScreenState();
}

class _ImageViewerScreenState extends State<ImageViewerScreen> {
  final _downloadService = ImageDownloadService();
  bool _downloading = false;

  String get _heroTag =>
      "result-image-${widget.args.localPath ?? widget.args.imageUrl}";

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
        localPath: widget.args.localPath,
        remoteUrl: widget.args.imageUrl,
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
    final local = widget.args.localPath;
    if (local != null && File(local).existsSync()) {
      return Image.file(File(local), fit: BoxFit.contain);
    }
    return Image.network(
      widget.args.imageUrl,
      fit: BoxFit.contain,
      loadingBuilder: (_, child, progress) {
        if (progress == null) return child;
        return const Padding(
          padding: EdgeInsets.all(48),
          child: CircularProgressIndicator(color: AppColors.violet),
        );
      },
      errorBuilder: (_, __, ___) => Padding(
        padding: const EdgeInsets.all(32),
        child: Text(
          "Could not load image",
          style: GoogleFonts.plusJakartaSans(color: AppColors.textMuted),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: 0.5),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.close_rounded, color: Colors.white),
          ),
        ),
        title: Text(
          widget.args.title,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
          ),
        ),
        centerTitle: true,
        actions: [
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
                : Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.5),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.download_rounded,
                      color: Colors.white,
                    ),
                  ),
          ),
        ],
      ),
      body: InteractiveViewer(
        minScale: 0.5,
        maxScale: 4,
        child: Center(
          child: Hero(tag: _heroTag, child: _buildImage()),
        ),
      ),
    );
  }
}
