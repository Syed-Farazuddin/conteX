import "package:flutter/material.dart";
import "package:google_fonts/google_fonts.dart";
import "package:url_launcher/url_launcher.dart";

import "../api/analytics_api.dart";
import "../app/app_routes.dart";
import "../services/auth_service.dart";
import "../theme/app_theme.dart";
import "../widgets/ambient_background.dart";
import "../widgets/analytics_widgets.dart";
import "../widgets/glass_card.dart";

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    if (!AuthService.instance.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          Navigator.of(context).pushReplacementNamed(AppRoutes.login);
        }
      });
    }
  }

  Future<void> _logout() async {
    await AuthService.instance.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed(AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    final org = AuthService.instance.user.value?.organizationName ?? "ConteX";
    const titles = ["Overview", "Social", "Product", "Connections"];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(titles[_tab]),
            Text(
              org,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            onPressed: _logout,
            icon: const Icon(Icons.logout_rounded),
            tooltip: "Sign out",
          ),
        ],
      ),
      body: Stack(
        children: [
          const AmbientBackground(),
          SafeArea(
            top: false,
            child: IndexedStack(
              index: _tab,
              children: const [
                _OverviewTab(),
                _SocialTab(),
                _ProductTab(),
                _ConnectionsTab(),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.violet.withValues(alpha: 0.2),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard_rounded),
            label: "Overview",
          ),
          NavigationDestination(
            icon: Icon(Icons.campaign_outlined),
            selectedIcon: Icon(Icons.campaign_rounded),
            label: "Social",
          ),
          NavigationDestination(
            icon: Icon(Icons.show_chart_outlined),
            selectedIcon: Icon(Icons.show_chart_rounded),
            label: "Product",
          ),
          NavigationDestination(
            icon: Icon(Icons.link_outlined),
            selectedIcon: Icon(Icons.link_rounded),
            label: "Connect",
          ),
        ],
      ),
    );
  }
}

// Shared loading/error scaffold for a tab body.
class _AsyncBody<T> extends StatefulWidget {
  const _AsyncBody({
    super.key,
    required this.load,
    required this.builder,
  });

  final Future<T> Function() load;
  final Widget Function(BuildContext, T, Future<void> Function()) builder;

  @override
  State<_AsyncBody<T>> createState() => _AsyncBodyState<T>();
}

class _AsyncBodyState<T> extends State<_AsyncBody<T>> {
  late Future<T> _future;

  @override
  void initState() {
    super.initState();
    _future = widget.load();
  }

  Future<void> _reload() async {
    setState(() => _future = widget.load());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: _future,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Center(
            child: CircularProgressIndicator(color: AppColors.violet),
          );
        }
        if (snap.hasError) {
          return _ErrorView(message: snap.error.toString(), onRetry: _reload);
        }
        return RefreshIndicator(
          color: AppColors.violet,
          backgroundColor: AppColors.surface,
          onRefresh: _reload,
          child: widget.builder(context, snap.data as T, _reload),
        );
      },
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: GoogleFonts.plusJakartaSans(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            TextButton(onPressed: onRetry, child: const Text("Retry")),
          ],
        ),
      ),
    );
  }
}

const _listPadding = EdgeInsets.fromLTRB(20, 12, 20, 32);

class _OverviewTab extends StatelessWidget {
  const _OverviewTab();

  @override
  Widget build(BuildContext context) {
    final api = AnalyticsApi();
    return _AsyncBody<(SocialOverview, ProductOverview)>(
      load: () async {
        final results = await Future.wait([api.social(), api.product()]);
        return (results[0] as SocialOverview, results[1] as ProductOverview);
      },
      builder: (context, data, _) {
        final (social, product) = data;
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: _listPadding,
          children: [
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.6,
              children: [
                StatTile(label: "Followers", value: social.followers),
                StatTile(label: "Impressions", value: social.impressions),
                StatTile(label: "Website users", value: social.websiteUsers),
                StatTile(label: "Product events", value: product.totalEvents),
              ],
            ),
            const SizedBox(height: 20),
            const SectionTitle("Product activity"),
            GlassCard(child: MiniLineChart(points: product.daily)),
          ],
        );
      },
    );
  }
}

class _SocialTab extends StatelessWidget {
  const _SocialTab();

  @override
  Widget build(BuildContext context) {
    final api = AnalyticsApi();
    return _AsyncBody<SocialOverview>(
      load: api.social,
      builder: (context, social, _) {
        if (social.totalAccounts == 0) {
          return ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: _listPadding,
            children: const [
              SizedBox(height: 80),
              _EmptyHint(
                title: "No social accounts connected",
                body:
                    "Open the Connect tab to link Facebook, Instagram or Google Analytics.",
              ),
            ],
          );
        }
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: _listPadding,
          children: [
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.6,
              children: [
                StatTile(label: "Followers", value: social.followers),
                StatTile(label: "Reach", value: social.reach),
              ],
            ),
            const SizedBox(height: 20),
            if (social.instagram.isNotEmpty) ...[
              const SectionTitle("Instagram"),
              ...social.instagram.map(
                (a) => _AccountCard(
                  account: a,
                  metric: "reach",
                  color: AppColors.fuchsia,
                ),
              ),
            ],
            if (social.facebook.isNotEmpty) ...[
              const SectionTitle("Facebook Pages"),
              ...social.facebook.map(
                (a) => _AccountCard(
                  account: a,
                  metric: "page_impressions",
                  color: AppColors.violet,
                ),
              ),
            ],
            if (social.googleAnalytics.isNotEmpty) ...[
              const SectionTitle("Google Analytics"),
              ...social.googleAnalytics.map(
                (a) => _AccountCard(
                  account: a,
                  metric: "activeUsers",
                  color: AppColors.amber,
                ),
              ),
            ],
          ],
        );
      },
    );
  }
}

class _AccountCard extends StatelessWidget {
  const _AccountCard({
    required this.account,
    required this.metric,
    required this.color,
  });

  final AccountInsights account;
  final String metric;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              account.accountName,
              style: GoogleFonts.plusJakartaSans(
                fontSize: 15,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            if (account.followers > 0)
              Text(
                "${formatCount(account.followers)} followers",
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 12,
                  color: AppColors.textMuted,
                ),
              ),
            const SizedBox(height: 12),
            if (account.error != null)
              Text(
                account.error!,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 13,
                  color: AppColors.textMuted,
                ),
              )
            else
              MiniLineChart(
                points: account.series[metric] ?? const [],
                color: color,
              ),
          ],
        ),
      ),
    );
  }
}

class _ProductTab extends StatelessWidget {
  const _ProductTab();

  @override
  Widget build(BuildContext context) {
    final api = AnalyticsApi();
    return _AsyncBody<ProductOverview>(
      load: api.product,
      builder: (context, product, _) {
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: _listPadding,
          children: [
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.6,
              children: [
                StatTile(label: "Total events", value: product.totalEvents),
                StatTile(label: "Sessions", value: product.uniqueSessions),
              ],
            ),
            const SizedBox(height: 20),
            const SectionTitle("Events over time"),
            GlassCard(child: MiniLineChart(points: product.daily)),
            const SizedBox(height: 20),
            const SectionTitle("Top event types"),
            GlassCard(
              child: Column(
                children: product.byType.isEmpty
                    ? [
                        Text(
                          "No events yet",
                          style: GoogleFonts.plusJakartaSans(
                            color: AppColors.textMuted,
                          ),
                        ),
                      ]
                    : product.byType
                        .take(6)
                        .map((e) => _StatRow(label: e.key, value: e.value))
                        .toList(),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow({required this.label, required this.value});
  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(
            child: Text(
              label,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.plusJakartaSans(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
          ),
          Text(
            value.toString(),
            style: GoogleFonts.plusJakartaSans(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}

class _ConnectionsTab extends StatefulWidget {
  const _ConnectionsTab();

  @override
  State<_ConnectionsTab> createState() => _ConnectionsTabState();
}

class _ConnectionsTabState extends State<_ConnectionsTab> {
  final _api = AnalyticsApi();
  String? _connecting;

  Future<void> _connect(String provider, Future<void> Function() reload) async {
    setState(() => _connecting = provider);
    try {
      final url = await _api.connectUrl(provider);
      await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              "Finish authorizing in your browser, then pull to refresh.",
            ),
          ),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Could not start the connection.")),
        );
      }
    } finally {
      if (mounted) setState(() => _connecting = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _AsyncBody<ConnectionsResponse>(
      load: _api.connections,
      builder: (context, data, reload) {
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: _listPadding,
          children: [
            _ProviderCard(
              name: "Meta (Facebook & Instagram)",
              configured: data.metaConfigured,
              connecting: _connecting == "meta",
              onConnect: () => _connect("meta", reload),
            ),
            const SizedBox(height: 12),
            _ProviderCard(
              name: "Google Analytics (GA4)",
              configured: data.googleConfigured,
              connecting: _connecting == "google",
              onConnect: () => _connect("google", reload),
            ),
            const SizedBox(height: 24),
            const SectionTitle("Linked accounts"),
            if (data.connections.isEmpty)
              const _EmptyHint(
                title: "No accounts linked yet",
                body: "Connect Meta or Google above to import analytics.",
              )
            else
              ...data.connections.map(
                (c) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: GlassCard(
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                c.accountName ?? c.externalAccountId,
                                style: GoogleFonts.plusJakartaSans(
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              Text(
                                c.provider,
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 12,
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: () async {
                            await _api.disconnect(c.id);
                            await reload();
                          },
                          child: const Text("Remove"),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _ProviderCard extends StatelessWidget {
  const _ProviderCard({
    required this.name,
    required this.configured,
    required this.connecting,
    required this.onConnect,
  });

  final String name;
  final bool configured;
  final bool connecting;
  final VoidCallback onConnect;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            name,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          if (!configured)
            Text(
              "Not configured on server",
              style: GoogleFonts.plusJakartaSans(
                fontSize: 13,
                color: AppColors.amber,
              ),
            )
          else
            SizedBox(
              height: 40,
              child: FilledButton(
                onPressed: connecting ? null : onConnect,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.violet,
                ),
                child: connecting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text("Connect"),
              ),
            ),
        ],
      ),
    );
  }
}

class _EmptyHint extends StatelessWidget {
  const _EmptyHint({required this.title, required this.body});
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Text(
            title,
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            body,
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}
