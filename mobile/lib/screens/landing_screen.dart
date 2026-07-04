import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:google_fonts/google_fonts.dart";

import "../app/app_routes.dart";
import "../app/route_observer.dart";
import "../models/saved_creation.dart";
import "../services/auth_service.dart";
import "../services/creation_history_service.dart";
import "../theme/app_theme.dart";
import "../widgets/ambient_background.dart";
import "../widgets/creation_history_section.dart";
import "../widgets/app_bottom_nav_bar.dart";
import "../widgets/app_main_header.dart";
import "../widgets/primary_button.dart";

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen>
    with RouteAware, WidgetsBindingObserver {
  final _historyService = CreationHistoryService.instance;
  List<SavedCreation> _history = [];
  bool _routeSubscribed = false;

  static const _features = [
    _Feature(
      emoji: "🌿",
      title: "Ghibli & anime",
      subtitle: "Soft film stills and bold illustration",
    ),
    _Feature(
      emoji: "🎬",
      title: "Cinematic",
      subtitle: "Dramatic light and film-grade color",
    ),
    _Feature(
      emoji: "💫",
      title: "Portrait glow",
      subtitle: "Editorial beauty and soft skin",
    ),
    _Feature(
      emoji: "🔮",
      title: "Fantasy",
      subtitle: "Magical atmosphere and ethereal light",
    ),
  ];

  static const _steps = [
    _Step(
      number: "01",
      title: "Pick a style",
      body: "Natural, Ghibli, anime, and more",
    ),
    _Step(
      number: "02",
      title: "Upload a photo",
      body: "From your gallery in one tap",
    ),
    _Step(
      number: "03",
      title: "View your creation",
      body: "Compare, save, and create again",
    ),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadHistory();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _loadHistory();
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_routeSubscribed) return;
    final route = ModalRoute.of(context);
    if (route is PageRoute<void>) {
      appRouteObserver.subscribe(this, route);
      _routeSubscribed = true;
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    appRouteObserver.unsubscribe(this);
    super.dispose();
  }

  @override
  void didPopNext() {
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    try {
      final items = await _historyService.loadAll();
      if (!mounted) return;
      setState(() => _history = items);
    } catch (_) {
      if (!mounted) return;
      setState(() => _history = []);
    }
  }

  void _openStudio() {
    HapticFeedback.lightImpact();
    Navigator.of(
      context,
    ).pushNamed(AppRoutes.studio).then((_) => _loadHistory());
  }

  void _openGallery() {
    HapticFeedback.lightImpact();
    Navigator.of(
      context,
    ).pushReplacementNamed(AppRoutes.gallery).then((_) => _loadHistory());
  }

  Future<void> _confirmDeleteCreation(SavedCreation item) async {
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
      await _loadHistory();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text("Deleted from your gallery"),
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
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: AppColors.background,
      bottomNavigationBar: SafeArea(
        child: AppBottomNavBar(
          currentTab: AppBottomTab.home,
          galleryCount: _history.length,
          onTabSelected: (tab) {
            switch (tab) {
              case AppBottomTab.home:
                return;
              case AppBottomTab.gallery:
                _openGallery();
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
              children: [
                AppMainHeader(
                  tab: AppBottomTab.home,
                  galleryCount: _history.length,
                ),
                Expanded(
                  child: RefreshIndicator(
                    color: AppColors.violet,
                    backgroundColor: AppColors.surface,
                    onRefresh: _loadHistory,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(
                        parent: BouncingScrollPhysics(),
                      ),
                      padding: EdgeInsets.fromLTRB(
                        24,
                        4,
                        24,
                        _history.isEmpty ? 24 : 88 + bottom,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const _HeroHeadline(),
                          const SizedBox(height: 20),
                          _AnalyticsEntryCard(
                            onTap: () {
                              final route =
                                  AuthService.instance.isAuthenticated
                                  ? AppRoutes.dashboard
                                  : AppRoutes.login;
                              Navigator.of(context).pushNamed(route);
                            },
                          ),
                          const SizedBox(height: 32),
                          CreationHistorySection(
                            creations: _history,
                            onSeeAll: _openGallery,
                            onDelete: _confirmDeleteCreation,
                            onCreateMore: _history.isEmpty ? null : _openStudio,
                          ),
                          const SizedBox(height: 32),
                          Text(
                            "POPULAR STYLES",
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.4,
                              color: AppColors.textMuted,
                            ),
                          ),
                          const SizedBox(height: 14),
                          SizedBox(
                            height: 140,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: _features.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(width: 12),
                              itemBuilder: (_, i) =>
                                  _FeatureCard(feature: _features[i]),
                            ),
                          ),
                          const SizedBox(height: 36),
                          Text(
                            "HOW IT WORKS",
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1.4,
                              color: AppColors.textMuted,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ..._steps.map(
                            (s) => Padding(
                              padding: const EdgeInsets.only(bottom: 14),
                              child: _StepTile(step: s),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const _TrustRow(),
                        ],
                      ),
                    ),
                  ),
                ),
                if (_history.isEmpty)
                  Padding(
                    padding: EdgeInsets.fromLTRB(24, 0, 24, 12 + bottom),
                    child: PrimaryButton(
                      label: "Start creating",
                      icon: Icons.arrow_forward_rounded,
                      onPressed: _openStudio,
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

class _AnalyticsEntryCard extends StatelessWidget {
  const _AnalyticsEntryCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0x668B5CF6)),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.violet.withValues(alpha: 0.18),
                AppColors.surface.withValues(alpha: 0.7),
              ],
            ),
          ),
          child: Row(
            children: [
              const Icon(Icons.insights_rounded, color: AppColors.violet),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Business Analytics",
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "Connect Meta & Google to track your audience",
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(
                Icons.arrow_forward_rounded,
                color: AppColors.textMuted,
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _HeroHeadline extends StatelessWidget {
  const _HeroHeadline();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [Color(0xFFE9D5FF), AppColors.violet, AppColors.fuchsia],
          ).createShader(bounds),
          child: Text(
            "Transform photos\ninto art",
            style: GoogleFonts.plusJakartaSans(
              fontSize: 40,
              fontWeight: FontWeight.w800,
              height: 1.1,
              letterSpacing: -1.2,
              color: Colors.white,
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          "Upload a portrait and reimagine it in Ghibli, anime, cinematic, "
          "and other premium AI styles — in seconds.",
          style: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            height: 1.5,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

class _Feature {
  const _Feature({
    required this.emoji,
    required this.title,
    required this.subtitle,
  });

  final String emoji;
  final String title;
  final String subtitle;
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({required this.feature});

  final _Feature feature;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.white.withValues(alpha: 0.07),
            AppColors.surface.withValues(alpha: 0.5),
          ],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(feature.emoji, style: const TextStyle(fontSize: 26)),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                feature.title,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                feature.subtitle,
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
        ],
      ),
    );
  }
}

class _Step {
  const _Step({required this.number, required this.title, required this.body});

  final String number;
  final String title;
  final String body;
}

class _StepTile extends StatelessWidget {
  const _StepTile({required this.step});

  final _Step step;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          step.number,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: AppColors.violet,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                step.title,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                step.body,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TrustRow extends StatelessWidget {
  const _TrustRow();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        color: Colors.white.withValues(alpha: 0.03),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.verified_user_outlined,
            color: AppColors.violet,
            size: 22,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              "Creations are saved on this device so you can revisit them anytime.",
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                height: 1.45,
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
