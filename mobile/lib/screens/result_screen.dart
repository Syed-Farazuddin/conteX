import "dart:io";

import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:google_fonts/google_fonts.dart";
import "package:url_launcher/url_launcher.dart";

import "../app/app_routes.dart";
import "../api/generation_api.dart";
import "../models/generation_session.dart";
import "../theme/app_theme.dart";
import "../widgets/ambient_background.dart";
import "../widgets/glass_card.dart";
import "../services/creation_history_service.dart";
import "../services/image_download_service.dart";
import "../widgets/app_snackbar.dart";
import "../widgets/primary_button.dart";
import "image_viewer_screen.dart";

class ResultScreen extends StatefulWidget {
  const ResultScreen({super.key, required this.session});

  final GenerationSession session;

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  final _downloadService = ImageDownloadService();
  final _historyService = CreationHistoryService.instance;
  bool _showOriginal = false;
  bool _downloading = false;
  bool _deleting = false;
  String? _savedId;
  String? _cachedOutputPath;
  String? _cachedInputPath;

  GenerationSession get _session => widget.session;

  String? get _outputPath => _cachedOutputPath ?? _session.localOutputPath;

  String? get _inputPath => _cachedInputPath ?? _session.localImagePath;

  @override
  void initState() {
    super.initState();
    _savedId = _session.savedCreationId;
    _cachedOutputPath = _session.localOutputPath;
    _cachedInputPath = _session.localImagePath;
    if (_savedId == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        await _retryGallerySave(silent: true);
        if (!mounted || _savedId != null) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              "Couldn't save to your gallery — tap Retry save below",
            ),
            behavior: SnackBarBehavior.floating,
          ),
        );
      });
    }
  }

  @override
  void dispose() {
    _downloadService.dispose();
    super.dispose();
  }

  Future<void> _retryGallerySave({bool silent = false}) async {
    try {
      final saved = await _historyService.save(
        inputSourcePath: _inputPath,
        inputBytes: _session.inputBytes,
        outputBytes: _session.result.outputBytes,
        outputUrl: _session.result.outputUrl,
        style: _session.style,
        result: _session.result,
      );
      if (!mounted) return;
      setState(() {
        _savedId = saved.id;
        _cachedOutputPath = saved.outputPath;
        if (saved.inputPath != saved.outputPath) {
          _cachedInputPath = saved.inputPath;
        }
      });
      if (!silent) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text("Saved to your gallery"),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (!mounted || silent) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            e is CreationStorageException ? e.message : "Save failed",
          ),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  Future<void> _deleteFromGallery() async {
    final id = _savedId;
    if (id == null || _deleting) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceElevated,
        title: Text(
          "Delete creation?",
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
        ),
        content: Text(
          "This removes the saved original and generated images from this device.",
          style: GoogleFonts.plusJakartaSans(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              "Delete",
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;

    setState(() => _deleting = true);
    try {
      await _historyService.delete(id);
      if (!mounted) return;
      Navigator.of(
        context,
      ).pushNamedAndRemoveUntil(AppRoutes.landing, (_) => false);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Could not delete")));
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  Future<void> _downloadImage() async {
    if (_downloading) return;

    HapticFeedback.mediumImpact();
    setState(() => _downloading = true);

    try {
      await _downloadService.saveOutput(
        localPath: _outputPath,
        remoteUrl: _session.result.outputUrl,
      );
      if (!mounted) return;
      HapticFeedback.lightImpact();
      AppSnackBar.show(context, "Saved to your photo library");
    } on ImageDownloadException catch (e) {
      if (!mounted) return;
      AppSnackBar.show(context, e.message);
    } catch (_) {
      if (!mounted) return;
      AppSnackBar.show(context, "Could not save image. Try again.");
    } finally {
      if (mounted) setState(() => _downloading = false);
    }
  }

  Future<void> _openExternal() async {
    final uri = Uri.tryParse(_session.result.outputUrl);
    if (uri == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Invalid image link")));
      return;
    }
    try {
      final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!opened && mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text("Could not open image")));
      }
    } on PlatformException catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Browser unavailable — fully quit and reopen the app"),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Could not open image")));
    }
  }

  void _viewFullscreen() {
    HapticFeedback.selectionClick();
    Navigator.of(context).pushNamed(
      AppRoutes.imageViewer,
      arguments: ImageViewerArgs(
        imageUrl: _session.result.outputUrl,
        localPath: _outputPath,
        title: _session.style.label,
        subtitle: "Generated",
      ),
    );
  }

  void _createAnother() {
    HapticFeedback.lightImpact();
    Navigator.of(context).pushNamedAndRemoveUntil(
      AppRoutes.studio,
      (route) => route.settings.name == AppRoutes.landing || route.isFirst,
    );
  }

  void _goHome() {
    Navigator.of(
      context,
    ).pushNamedAndRemoveUntil(AppRoutes.landing, (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    final style = _session.style;
    final result = _session.result;
    final hasOriginal = _session.hasOriginalPhoto;
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          const AmbientBackground(),
          SafeArea(
            child: Column(
              children: [
                _ResultTopBar(onHome: _goHome),
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _SuccessBadge(),
                        const SizedBox(height: 20),
                        _StyleHeroCard(style: style),
                        const SizedBox(height: 20),
                        if (hasOriginal) ...[
                          _CompareToggle(
                            showOriginal: _showOriginal,
                            onChanged: (showOrig) {
                              if (showOrig && !_session.hasOriginalPhoto) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      "Original photo isn't available on this device",
                                    ),
                                    behavior: SnackBarBehavior.floating,
                                  ),
                                );
                                return;
                              }
                              setState(() => _showOriginal = showOrig);
                            },
                          ),
                          const SizedBox(height: 12),
                        ],
                        _ImageFrame(
                          showOriginal: _showOriginal && hasOriginal,
                          localPath: _inputPath,
                          outputPath: _outputPath,
                          outputUrl: result.outputUrl,
                        ),
                        const SizedBox(height: 20),
                        GlassCard(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _DetailRow(
                                icon: Icons.palette_outlined,
                                label: "Style applied",
                                value: style.label,
                              ),
                              if (style.description.isNotEmpty) ...[
                                const SizedBox(height: 12),
                                Text(
                                  style.description,
                                  style: GoogleFonts.plusJakartaSans(
                                    fontSize: 13,
                                    height: 1.45,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                        SizedBox(height: 120 + bottom),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.fromLTRB(20, 0, 20, 12 + bottom),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (_savedId == null) ...[
                PrimaryButton(
                  label: "Retry gallery save",
                  icon: Icons.save_alt_rounded,
                  onPressed: _retryGallerySave,
                ),
                const SizedBox(height: 10),
              ],
              PrimaryButton(
                label: _downloading ? "Saving…" : "Save to Photos",
                icon: Icons.download_rounded,
                loading: _downloading,
                onPressed: _downloadImage,
              ),
              const SizedBox(height: 10),
              if (_savedId != null)
                PrimaryButton(
                  label: _deleting ? "Deleting…" : "Delete from gallery",
                  icon: Icons.delete_outline_rounded,
                  loading: _deleting,
                  variant: PrimaryButtonVariant.outline,
                  onPressed: _deleteFromGallery,
                ),
              if (_savedId != null) const SizedBox(height: 10),
              PrimaryButton(
                label: "View full screen",
                icon: Icons.fullscreen_rounded,
                variant: PrimaryButtonVariant.outline,
                onPressed: _viewFullscreen,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: PrimaryButton(
                      label: "Create another",
                      icon: Icons.add_photo_alternate_outlined,
                      variant: PrimaryButtonVariant.outline,
                      onPressed: _createAnother,
                    ),
                  ),
                  const SizedBox(width: 10),
                  IconButton.filled(
                    onPressed: _openExternal,
                    style: IconButton.styleFrom(
                      backgroundColor: AppColors.surfaceElevated,
                      foregroundColor: AppColors.textPrimary,
                      minimumSize: const Size(56, 56),
                    ),
                    icon: const Icon(Icons.open_in_new_rounded),
                    tooltip: "Open in browser",
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ResultTopBar extends StatelessWidget {
  const _ResultTopBar({required this.onHome});

  final VoidCallback onHome;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 4, 16, 8),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.of(context).maybePop(),
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
            color: AppColors.textPrimary,
          ),
          Expanded(
            child: Text(
              "Your creation",
              style: GoogleFonts.plusJakartaSans(
                fontSize: 17,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          TextButton(
            onPressed: onHome,
            child: Text(
              "Home",
              style: GoogleFonts.plusJakartaSans(
                fontWeight: FontWeight.w600,
                color: const Color(0xFFC4B5FD),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SuccessBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          color: AppColors.success.withValues(alpha: 0.12),
          border: Border.all(color: AppColors.success.withValues(alpha: 0.35)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.check_circle_rounded,
              color: AppColors.success,
              size: 18,
            ),
            const SizedBox(width: 8),
            Text(
              "Generation complete",
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.success,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StyleHeroCard extends StatelessWidget {
  const _StyleHeroCard({required this.style});

  final GenerationStyle style;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0x668B5CF6)),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0x338B5CF6), Color(0x1A1A1A26)],
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 64,
            height: 64,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              color: Colors.white.withValues(alpha: 0.06),
              border: Border.all(color: AppColors.borderStrong),
            ),
            child: Text(style.emoji, style: const TextStyle(fontSize: 32)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Styled as",
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                    color: AppColors.textMuted,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  style.label,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CompareToggle extends StatelessWidget {
  const _CompareToggle({required this.showOriginal, required this.onChanged});

  final bool showOriginal;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: AppColors.surface.withValues(alpha: 0.8),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Expanded(
            child: _ToggleChip(
              label: "Generated",
              selected: !showOriginal,
              onTap: () => onChanged(false),
            ),
          ),
          Expanded(
            child: _ToggleChip(
              label: "Original",
              selected: showOriginal,
              onTap: () => onChanged(true),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToggleChip extends StatelessWidget {
  const _ToggleChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(11),
          gradient: selected
              ? const LinearGradient(
                  colors: [AppColors.violet, AppColors.fuchsia],
                )
              : null,
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: selected ? Colors.white : AppColors.textMuted,
          ),
        ),
      ),
    );
  }
}

class _ImageFrame extends StatelessWidget {
  const _ImageFrame({
    required this.showOriginal,
    required this.localPath,
    required this.outputPath,
    required this.outputUrl,
  });

  final bool showOriginal;
  final String? localPath;
  final String? outputPath;
  final String outputUrl;

  static Widget _placeholder(String message) {
    return Container(
      color: AppColors.surface,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      child: Text(
        message,
        textAlign: TextAlign.center,
        style: GoogleFonts.plusJakartaSans(
          color: AppColors.textMuted,
          fontSize: 13,
        ),
      ),
    );
  }

  Widget _buildOriginal() {
    final path = localPath;
    if (path == null || !File(path).existsSync()) {
      return _placeholder("Original photo is no longer on this device");
    }
    return Image.file(
      File(path),
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      gaplessPlayback: true,
      errorBuilder: (_, __, ___) =>
          _placeholder("Could not load original photo"),
    );
  }

  Widget _buildGenerated() {
    if (outputPath != null && File(outputPath!).existsSync()) {
      return Image.file(
        File(outputPath!),
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        gaplessPlayback: true,
        errorBuilder: (_, __, ___) =>
            _placeholder("Could not load generated image"),
      );
    }
    return Image.network(
      outputUrl,
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
      gaplessPlayback: true,
      loadingBuilder: (_, child, progress) {
        if (progress == null) return child;
        return Container(
          color: AppColors.surface,
          alignment: Alignment.center,
          child: const CircularProgressIndicator(color: AppColors.violet),
        );
      },
      errorBuilder: (_, __, ___) =>
          _placeholder("Could not load generated image"),
    );
  }

  @override
  Widget build(BuildContext context) {
    final originalReady =
        localPath != null &&
        localPath != outputPath &&
        File(localPath!).existsSync();
    final index = showOriginal && originalReady ? 0 : 1;

    return AspectRatio(
      aspectRatio: 3 / 4,
      child: GlassCard(
        padding: EdgeInsets.zero,
        borderRadius: 24,
        highlight: true,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(23),
          child: IndexedStack(
            index: index,
            children: [_buildOriginal(), _buildGenerated()],
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: AppColors.violet),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label.toUpperCase(),
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                  color: AppColors.textMuted,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 14,
                  height: 1.4,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
