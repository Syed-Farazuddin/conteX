import "../services/auth_service.dart";

class SeriesPoint {
  const SeriesPoint(this.date, this.value);
  final String date;
  final double value;
}

List<SeriesPoint> _series(dynamic raw) {
  if (raw is! List) return const [];
  return raw
      .whereType<Map<String, dynamic>>()
      .map((m) => SeriesPoint(
            (m["date"] ?? "").toString(),
            ((m["value"] ?? 0) as num).toDouble(),
          ))
      .toList();
}

class AccountInsights {
  AccountInsights({
    required this.accountName,
    required this.totals,
    required this.series,
    this.followers = 0,
    this.error,
  });

  final String accountName;
  final Map<String, num> totals;
  final Map<String, List<SeriesPoint>> series;
  final int followers;
  final String? error;

  factory AccountInsights.fromJson(Map<String, dynamic> j) {
    final totalsRaw = (j["totals"] as Map<String, dynamic>?) ?? {};
    final seriesRaw = (j["series"] as Map<String, dynamic>?) ?? {};
    return AccountInsights(
      accountName: (j["accountName"] ?? "Account").toString(),
      totals: totalsRaw.map((k, v) => MapEntry(k, (v as num?) ?? 0)),
      series: seriesRaw.map((k, v) => MapEntry(k, _series(v))),
      followers: (j["followers"] as num?)?.toInt() ?? 0,
      error: j["error"] as String?,
    );
  }
}

class SocialOverview {
  SocialOverview({
    required this.followers,
    required this.impressions,
    required this.reach,
    required this.websiteUsers,
    required this.facebook,
    required this.instagram,
    required this.googleAnalytics,
  });

  final int followers;
  final int impressions;
  final int reach;
  final int websiteUsers;
  final List<AccountInsights> facebook;
  final List<AccountInsights> instagram;
  final List<AccountInsights> googleAnalytics;

  int get totalAccounts =>
      facebook.length + instagram.length + googleAnalytics.length;

  static List<AccountInsights> _accounts(dynamic raw) {
    if (raw is! List) return const [];
    return raw
        .whereType<Map<String, dynamic>>()
        .map(AccountInsights.fromJson)
        .toList();
  }

  factory SocialOverview.fromJson(Map<String, dynamic> j) {
    final s = (j["summary"] as Map<String, dynamic>?) ?? {};
    return SocialOverview(
      followers: (s["followers"] as num?)?.toInt() ?? 0,
      impressions: (s["impressions"] as num?)?.toInt() ?? 0,
      reach: (s["reach"] as num?)?.toInt() ?? 0,
      websiteUsers: (s["websiteUsers"] as num?)?.toInt() ?? 0,
      facebook: _accounts(j["facebook"]),
      instagram: _accounts(j["instagram"]),
      googleAnalytics: _accounts(j["googleAnalytics"]),
    );
  }
}

class ProductOverview {
  ProductOverview({
    required this.totalEvents,
    required this.uniqueSessions,
    required this.eventTypes,
    required this.byType,
    required this.topPaths,
    required this.daily,
  });

  final int totalEvents;
  final int uniqueSessions;
  final int eventTypes;
  final List<MapEntry<String, int>> byType;
  final List<MapEntry<String, int>> topPaths;
  final List<SeriesPoint> daily;

  factory ProductOverview.fromJson(Map<String, dynamic> j) {
    final s = (j["summary"] as Map<String, dynamic>?) ?? {};
    List<MapEntry<String, int>> pairs(dynamic raw, String key) {
      if (raw is! List) return const [];
      return raw.whereType<Map<String, dynamic>>().map((m) {
        return MapEntry(
          (m[key] ?? "—").toString(),
          (m["count"] as num?)?.toInt() ?? 0,
        );
      }).toList();
    }

    final daily = ((j["daily"] as List?) ?? [])
        .whereType<Map<String, dynamic>>()
        .map((m) => SeriesPoint(
              (m["date"] ?? "").toString(),
              ((m["count"] ?? 0) as num).toDouble(),
            ))
        .toList();

    return ProductOverview(
      totalEvents: (s["totalEvents"] as num?)?.toInt() ?? 0,
      uniqueSessions: (s["uniqueSessions"] as num?)?.toInt() ?? 0,
      eventTypes: (s["eventTypes"] as num?)?.toInt() ?? 0,
      byType: pairs(j["byType"], "eventType"),
      topPaths: pairs(j["topPaths"], "path"),
      daily: daily,
    );
  }
}

class ConnectionItem {
  ConnectionItem({
    required this.id,
    required this.provider,
    required this.status,
    required this.accountName,
    required this.externalAccountId,
  });

  final String id;
  final String provider;
  final String status;
  final String? accountName;
  final String externalAccountId;

  factory ConnectionItem.fromJson(Map<String, dynamic> j) {
    return ConnectionItem(
      id: j["id"] as String,
      provider: j["provider"] as String,
      status: j["status"] as String,
      accountName: j["accountName"] as String?,
      externalAccountId: j["externalAccountId"] as String,
    );
  }
}

class ConnectionsResponse {
  ConnectionsResponse({
    required this.metaConfigured,
    required this.googleConfigured,
    required this.connections,
  });

  final bool metaConfigured;
  final bool googleConfigured;
  final List<ConnectionItem> connections;

  factory ConnectionsResponse.fromJson(Map<String, dynamic> j) {
    final providers = (j["providers"] as Map<String, dynamic>?) ?? {};
    return ConnectionsResponse(
      metaConfigured: providers["meta"] == true,
      googleConfigured: providers["google"] == true,
      connections: ((j["connections"] as List?) ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ConnectionItem.fromJson)
          .toList(),
    );
  }
}

class AnalyticsApi {
  final _auth = AuthService.instance;

  Future<SocialOverview> social({int days = 30}) async {
    final json = await _auth.authFetch("/api/analytics/social?days=$days");
    return SocialOverview.fromJson(json as Map<String, dynamic>);
  }

  Future<ProductOverview> product({int days = 30}) async {
    final json = await _auth.authFetch("/api/analytics/product?days=$days");
    return ProductOverview.fromJson(json as Map<String, dynamic>);
  }

  Future<ConnectionsResponse> connections() async {
    final json = await _auth.authFetch("/api/integrations");
    return ConnectionsResponse.fromJson(json as Map<String, dynamic>);
  }

  Future<String> connectUrl(String provider) async {
    final json = await _auth.authFetch("/api/integrations/$provider/connect");
    return (json as Map<String, dynamic>)["url"] as String;
  }

  Future<void> disconnect(String id) async {
    await _auth.authFetch("/api/integrations/$id", method: "DELETE");
  }

  Future<void> track(String eventType, {String? path}) async {
    try {
      await _auth.authFetch(
        "/api/analytics/track",
        method: "POST",
        body: {"eventType": eventType, "path": path, "source": "app"},
      );
    } catch (_) {
      // best-effort
    }
  }
}
