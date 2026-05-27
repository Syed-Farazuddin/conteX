import "package:flutter/material.dart";
import "package:google_fonts/google_fonts.dart";

import "../app/app_routes.dart";
import "../theme/app_theme.dart";
import "../widgets/ambient_background.dart";
import "../widgets/app_bottom_nav_bar.dart";
import "../widgets/app_main_header.dart";
import "../widgets/app_logo.dart";
import "../widgets/glass_card.dart";

class ContexPage extends StatelessWidget {
  const ContexPage({super.key});

  void _onTabSelected(BuildContext context, AppBottomTab tab) {
    switch (tab) {
      case AppBottomTab.home:
        Navigator.of(context).pushReplacementNamed(AppRoutes.landing);
        return;
      case AppBottomTab.gallery:
        Navigator.of(context).pushReplacementNamed(AppRoutes.gallery);
        return;
      case AppBottomTab.contex:
        return;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomNavInset =
        kBottomNavigationBarHeight +
        MediaQuery.paddingOf(context).bottom +
        8; // extra breathing room above the glass bar

    return Scaffold(
      backgroundColor: AppColors.background,
      bottomNavigationBar: SafeArea(
        child: AppBottomNavBar(
          currentTab: AppBottomTab.contex,
          galleryCount: 0,
          onTabSelected: (tab) => _onTabSelected(context, tab),
        ),
      ),
      body: Stack(
        children: [
          const AmbientBackground(),
          SafeArea(
            child: Column(
              children: [
                const AppMainHeader(tab: AppBottomTab.contex),
                Expanded(
                  child: SingleChildScrollView(
                    padding: EdgeInsets.fromLTRB(
                      20,
                      0,
                      20,
                      24 + bottomNavInset,
                    ),
                    physics: const BouncingScrollPhysics(
                      parent: AlwaysScrollableScrollPhysics(),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          "Turn your portrait into art in a few taps.",
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            height: 1.15,
                            letterSpacing: -0.8,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          "ConteX uses an AI generation pipeline to apply styles like Ghibli, anime, cinematic looks, and more. Your creations are saved locally on-device.",
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 14,
                            height: 1.6,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 22),
                        _ExampleGrid(),
                        const SizedBox(height: 18),
                        // GlassCard(
                        //   child: Padding(
                        //     padding: const EdgeInsets.all(16),
                        //     child: Column(
                        //       crossAxisAlignment: CrossAxisAlignment.start,
                        //       children: [
                        //         Text(
                        //           "Saved locally",
                        //           style: GoogleFonts.plusJakartaSans(
                        //             fontSize: 16,
                        //             fontWeight: FontWeight.w800,
                        //             color: AppColors.textPrimary,
                        //           ),
                        //         ),
                        //         const SizedBox(height: 6),
                        //         Text(
                        //           "Original + generated images are stored inside the app on this device. You can delete them anytime from the gallery or the result screen.",
                        //           style: GoogleFonts.plusJakartaSans(
                        //             fontSize: 13,
                        //             height: 1.55,
                        //             color: AppColors.textSecondary,
                        //           ),
                        //         ),
                        //       ],
                        //     ),
                        //   ),
                        // ),
                        const SizedBox(height: 20),
                      ],
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

class _ExampleGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      crossAxisCount: 2,
      mainAxisSpacing: 14,
      crossAxisSpacing: 14,
      physics: const NeverScrollableScrollPhysics(),
      // Make each card cell slightly taller to prevent RenderFlex overflow.
      childAspectRatio: 0.78,
      children: const [
        _ExampleCard(
          title: "Ghibli & anime",
          description: "Soft film stills + bold illustration.",
          icon: Icons.auto_awesome_rounded,
          accent: AppColors.violet,
        ),
        _ExampleCard(
          title: "Cinematic",
          description: "Dramatic light, film-grade color.",
          icon: Icons.motion_photos_on_rounded,
          accent: AppColors.fuchsia,
        ),
        _ExampleCard(
          title: "Portrait glow",
          description: "Editorial beauty and soft skin.",
          icon: Icons.face_retouching_natural_rounded,
          accent: AppColors.rose,
        ),
        _ExampleCard(
          title: "Fantasy",
          description: "Magical atmosphere and ethereal light.",
          icon: Icons.auto_fix_high_rounded,
          accent: AppColors.amber,
        ),
      ],
    );
  }
}

class _ExampleCard extends StatelessWidget {
  const _ExampleCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.accent,
  });

  final String title;
  final String description;
  final IconData icon;
  final Color accent;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              height: 96,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(18),
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    accent.withValues(alpha: 0.26),
                    AppColors.surfaceElevated.withValues(alpha: 0.9),
                  ],
                ),
                border: Border.all(color: AppColors.borderStrong),
              ),
              child: Stack(
                children: [
                  Positioned(
                    left: 10,
                    top: 10,
                    child: Icon(icon, color: accent, size: 26),
                  ),
                  Positioned(
                    right: 10,
                    bottom: 10,
                    child: Opacity(
                      opacity: 0.15,
                      child: Icon(
                        Icons.auto_awesome_rounded,
                        color: accent,
                        size: 46,
                      ),
                    ),
                  ),
                  Positioned.fill(
                    child: Align(
                      alignment: Alignment.center,
                      child: SizedBox(
                        width: 56,
                        height: 56,
                        child: AppLogo.icon(
                          size: 56,
                          borderRadius: 16,
                          showShadow: false,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 5),
            Text(
              description,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                height: 1.35,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
