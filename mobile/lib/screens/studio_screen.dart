import "dart:convert";
import "dart:typed_data";

import "package:flutter/foundation.dart";
import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:google_fonts/google_fonts.dart";
import "package:image_picker/image_picker.dart";

import "../api/generation_api.dart";
import "../app/app_routes.dart";
import "../config/api_config.dart";
import "../models/generation_session.dart";
import "../models/saved_creation.dart";
import "../services/creation_history_service.dart";
import "../theme/app_theme.dart";
import "../widgets/ambient_background.dart";
import "../widgets/app_logo.dart";
import "../widgets/glass_card.dart";
import "../widgets/photo_upload_card.dart";
import "../widgets/primary_button.dart";
import "../widgets/section_header.dart";
import "../widgets/status_banner.dart";
import "../widgets/style_carousel.dart";

class StudioScreen extends StatefulWidget {
  const StudioScreen({super.key});

  @override
  State<StudioScreen> createState() => _StudioScreenState();
}

class _StudioScreenState extends State<StudioScreen> {
  final _api = GenerationApi();
  final _historyService = CreationHistoryService.instance;
  final _promptController = TextEditingController();
  final _picker = ImagePicker();

  List<GenerationStyle> _styles = [];
  bool _apiReady = false;
  bool _apiReachable = false;
  bool _stylesLoading = true;
  String _styleId = "natural";
  String? _localImagePath;
  Uint8List? _pickedImageBytes;
  String? _imageBase64;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStyles();
  }

  @override
  void dispose() {
    _promptController.dispose();
    _api.dispose();
    super.dispose();
  }

  Future<void> _loadStyles() async {
    setState(() => _stylesLoading = true);
    try {
      final data = await _api.fetchStyles();
      if (!mounted) return;
      setState(() {
        _apiReachable = true;
        _apiReady = data.configured;
        _styles = data.styles;
        _stylesLoading = false;
        if (_styles.isNotEmpty && !_styles.any((s) => s.id == _styleId)) {
          _styleId = _styles.first.id;
        }
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _apiReachable = false;
        _apiReady = false;
        _stylesLoading = false;
      });
    }
  }

  Future<SavedCreation?> _persistToGallery(
    GenerationResult data,
    GenerationStyle style,
  ) async {
    return _historyService.save(
      inputSourcePath: _localImagePath,
      inputBytes: _pickedImageBytes,
      outputBytes: data.outputBytes,
      outputUrl: data.outputUrl,
      style: style,
      result: data,
    );
  }

  Future<void> _pickImage() async {
    HapticFeedback.lightImpact();
    final picked = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 90,
    );
    if (picked == null) return;

    final bytes = await picked.readAsBytes();
    final mime = picked.mimeType ?? "image/jpeg";
    final b64 = base64Encode(bytes);

    String path = picked.path;
    try {
      path = await _historyService.stageInputFile(picked.path);
    } catch (_) {
      // Fall back to picker path if staging fails.
    }

    setState(() {
      _localImagePath = path;
      _pickedImageBytes = bytes;
      _imageBase64 = "data:$mime;base64,$b64";
      _error = null;
    });
  }

  Future<void> _generate() async {
    if (_imageBase64 == null) {
      setState(() => _error = "Add a photo to continue.");
      return;
    }

    final style = _selectedStyle;
    if (style == null) return;

    HapticFeedback.mediumImpact();
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _api.generate(
        imageBase64: _imageBase64!,
        styleId: _styleId,
        prompt: _promptController.text,
      );
      if (!mounted) return;

      SavedCreation? saved;
      try {
        saved = await _persistToGallery(data, style);
      } catch (e) {
        debugPrint("Failed to save creation locally: $e");
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                e is CreationStorageException
                    ? e.message
                    : "Could not save to gallery",
              ),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }

      if (!mounted) return;

      await Navigator.of(context).pushReplacementNamed(
        AppRoutes.result,
        arguments: GenerationSession(
          result: data,
          style: style,
          localImagePath: saved?.inputPath ?? _localImagePath,
          localOutputPath: saved?.outputPath,
          savedCreationId: saved?.id,
          inputBytes: _pickedImageBytes,
        ),
      );
    } catch (err) {
      if (!mounted) return;
      setState(() => _error = err.toString().replaceFirst("Exception: ", ""));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  GenerationStyle? get _selectedStyle {
    for (final s in _styles) {
      if (s.id == _styleId) return s;
    }
    return null;
  }

  String get _statusMessage {
    if (_apiReachable) {
      return "The server is running but Replicate isn't configured. Add "
          "REPLICATE_API_TOKEN to backend/.env, then run npm run dev:backend.";
    }
    return "Start the API from the repo root: npm run dev:backend\n\n"
        "Simulator uses http://localhost:4000. On a real iPhone, set "
        "API_BASE_URL in mobile/.env to your Mac's Wi‑Fi IP (e.g. "
        "http://192.168.1.10:4000) and rebuild.";
  }

  @override
  Widget build(BuildContext context) {
    final selected = _selectedStyle;
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          const AmbientBackground(),
          SafeArea(
            child: Column(
              children: [
                _StudioTopBar(apiReady: _apiReady),
                Expanded(
                  child: CustomScrollView(
                    physics: const BouncingScrollPhysics(
                      parent: AlwaysScrollableScrollPhysics(),
                    ),
                    slivers: [
                      SliverPadding(
                        padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
                        sliver: SliverList(
                          delegate: SliverChildListDelegate([
                            if (!_apiReady) ...[
                              StatusBanner(
                                apiReachable: _apiReachable,
                                message: _statusMessage,
                                apiBaseUrl: kDebugMode ? apiBaseUrl : null,
                                onRetry: _loadStyles,
                              ),
                              const SizedBox(height: 20),
                            ],
                            const SectionHeader(
                              title: "Style",
                              subtitle: "Swipe to explore looks",
                            ),
                            StyleCarousel(
                              styles: _styles,
                              selectedId: _styleId,
                              loading: _stylesLoading,
                              disabled: _loading,
                              onSelected: (id) => setState(() => _styleId = id),
                            ),
                            const SizedBox(height: 22),
                            PhotoUploadCard(
                              imagePath: _localImagePath,
                              imageBytes: _pickedImageBytes,
                              selectedStyle: selected,
                              disabled: _loading,
                              onTap: _pickImage,
                            ),
                            const SizedBox(height: 18),
                            const SectionHeader(title: "Details"),
                            GlassCard(
                              child: TextField(
                                controller: _promptController,
                                enabled: !_loading,
                                maxLines: 3,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  color: AppColors.textPrimary,
                                ),
                                decoration: InputDecoration(
                                  hintText:
                                      "Optional — sunset glow, soft smile, film grain…",
                                  border: InputBorder.none,
                                  enabledBorder: InputBorder.none,
                                  focusedBorder: InputBorder.none,
                                  filled: false,
                                  contentPadding: EdgeInsets.zero,
                                ),
                              ),
                            ),
                            if (_error != null) ...[
                              const SizedBox(height: 14),
                              _ErrorCard(message: _error!),
                            ],
                            SizedBox(height: 100 + bottomInset),
                          ]),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (_loading) const _GeneratingOverlay(),
        ],
      ),
      bottomNavigationBar: _localImagePath != null
          ? SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: PrimaryButton(
                  label: _loading
                      ? "Creating magic…"
                      : "Generate ${selected?.label ?? "image"}",
                  icon: Icons.auto_awesome_rounded,
                  loading: _loading,
                  enabled: _apiReady && _imageBase64 != null,
                  onPressed: _generate,
                ),
              ),
            )
          : null,
    );
  }
}

class _StudioTopBar extends StatelessWidget {
  const _StudioTopBar({required this.apiReady});

  final bool apiReady;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 16, 4),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.of(context).maybePop(),
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
            color: AppColors.textPrimary,
          ),
          const AppLogo.icon(size: 36, borderRadius: 12, showShadow: false),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Create",
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                Text(
                  "Choose style & upload",
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          _StatusPill(ready: apiReady),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.ready});

  final bool ready;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(999),
        color: (ready ? AppColors.success : AppColors.amber).withValues(
          alpha: 0.12,
        ),
        border: Border.all(
          color: (ready ? AppColors.success : AppColors.amber).withValues(
            alpha: 0.35,
          ),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: ready ? AppColors.success : AppColors.amber,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            ready ? "Ready" : "Offline",
            style: GoogleFonts.plusJakartaSans(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: ready ? AppColors.success : AppColors.amber,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(14),
        color: AppColors.error.withValues(alpha: 0.1),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.error_outline_rounded,
            color: AppColors.error,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                height: 1.4,
                color: const Color(0xFFFECACA),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _GeneratingOverlay extends StatelessWidget {
  const _GeneratingOverlay();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withValues(alpha: 0.72),
      child: Center(
        child: GlassCard(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 40,
                height: 40,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: AppColors.violet,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                "Transforming your photo",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                "Taking you to your creation when ready…",
                textAlign: TextAlign.center,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
