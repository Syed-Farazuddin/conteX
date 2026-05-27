import "dart:io";

import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:google_fonts/google_fonts.dart";

import "../app/app_routes.dart";
import "../models/generation_session.dart";
import "../models/saved_creation.dart";
import "../services/creation_history_service.dart";
import "../theme/app_theme.dart";
import "../widgets/ambient_background.dart";
import "../widgets/app_bottom_nav_bar.dart";
import "../widgets/app_main_header.dart";

class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key});

  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  final _historyService = CreationHistoryService.instance;
  List<SavedCreation> _creations = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final items = await _historyService.loadAll();
    if (!mounted) return;
    setState(() {
      _creations = items;
      _loading = false;
    });
  }

  void _open(SavedCreation item) {
    HapticFeedback.selectionClick();
    Navigator.of(
      context,
    ).pushNamed(AppRoutes.result, arguments: GenerationSession.fromSaved(item));
  }

  Future<void> _confirmDelete(SavedCreation item) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surfaceElevated,
        title: Text(
          "Delete creation?",
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
        ),
        content: Text(
          "Removes the saved original and generated images from this device.",
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

    try {
      await _historyService.delete(item.id);
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Deleted"),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text("Could not delete")));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      bottomNavigationBar: SafeArea(
        child: AppBottomNavBar(
          currentTab: AppBottomTab.gallery,
          galleryCount: _creations.length,
          onTabSelected: (tab) {
            switch (tab) {
              case AppBottomTab.home:
                Navigator.of(context).pushReplacementNamed(AppRoutes.landing);
                return;
              case AppBottomTab.gallery:
                return;
              case AppBottomTab.contex:
                Navigator.of(context).pushReplacementNamed(AppRoutes.contex);
                return;
            }
          },
        ),
      ),
      body: Stack(
        children: [
          const AmbientBackground(),
          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AppMainHeader(
                  tab: AppBottomTab.gallery,
                  galleryCount: _creations.length,
                ),
                Expanded(
                  child: _loading
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: AppColors.violet,
                            strokeWidth: 2,
                          ),
                        )
                      : _creations.isEmpty
                      ? _EmptyGallery(
                          onCreate: () {
                            Navigator.of(context).pushNamed(AppRoutes.studio);
                          },
                        )
                      : RefreshIndicator(
                          color: AppColors.violet,
                          onRefresh: _load,
                          child: GridView.builder(
                            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
                            physics: const AlwaysScrollableScrollPhysics(
                              parent: BouncingScrollPhysics(),
                            ),
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 2,
                                  mainAxisSpacing: 14,
                                  crossAxisSpacing: 14,
                                  childAspectRatio: 0.72,
                                ),
                            itemCount: _creations.length,
                            itemBuilder: (context, index) {
                              final item = _creations[index];
                              return _GalleryTile(
                                creation: item,
                                onTap: () => _open(item),
                                onLongPress: () => _confirmDelete(item),
                              );
                            },
                          ),
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

class _EmptyGallery extends StatelessWidget {
  const _EmptyGallery({required this.onCreate});

  final VoidCallback onCreate;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.photo_library_outlined,
              size: 56,
              color: AppColors.violet.withValues(alpha: 0.6),
            ),
            const SizedBox(height: 20),
            Text(
              "No saved creations yet",
              style: GoogleFonts.plusJakartaSans(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              "Generate an image and it will appear here automatically.",
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 14,
                height: 1.45,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onCreate,
              icon: const Icon(Icons.add_rounded),
              label: const Text("Create now"),
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.violet,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 14,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GalleryTile extends StatelessWidget {
  const _GalleryTile({
    required this.creation,
    required this.onTap,
    this.onLongPress,
  });

  final SavedCreation creation;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.border),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(17),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: Image.file(
                    File(creation.outputPath),
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: AppColors.surface,
                      child: const Icon(Icons.broken_image_outlined),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(10),
                  color: AppColors.surface.withValues(alpha: 0.95),
                  child: Row(
                    children: [
                      Text(
                        creation.styleEmoji,
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          creation.styleLabel,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ),
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
