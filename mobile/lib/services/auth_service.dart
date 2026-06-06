import "dart:convert";

import "package:flutter/foundation.dart";
import "package:flutter_secure_storage/flutter_secure_storage.dart";
import "package:http/http.dart" as http;

import "../config/api_config.dart";
import "../models/auth_user.dart";

class ApiException implements Exception {
  ApiException(this.message, this.status);
  final String message;
  final int status;
  @override
  String toString() => message;
}

/// App-wide auth state + authenticated HTTP. Mirrors the web AuthContext:
/// short-lived access token in memory, long-lived refresh token in secure
/// storage (mobile has no httpOnly cookie).
class AuthService {
  AuthService._();
  static final AuthService instance = AuthService._();

  static const _refreshKey = "contex_refresh_token";
  final _storage = const FlutterSecureStorage();
  final ValueNotifier<AuthUser?> user = ValueNotifier<AuthUser?>(null);

  String? _accessToken;
  bool get isAuthenticated => user.value != null;

  Uri _uri(String path) => Uri.parse("$apiBaseUrl$path");

  // ── Session lifecycle ────────────────────────────────────────────────
  Future<void> restore() async {
    final refresh = await _storage.read(key: _refreshKey);
    if (refresh == null || refresh.isEmpty) return;
    try {
      await _refresh(refresh);
      await _loadMe();
    } catch (_) {
      await _clear();
    }
  }

  Future<void> login(String email, String password) async {
    final tokens = await _postJson("/api/auth/login", {
      "email": email,
      "password": password,
    });
    await _persistTokens(tokens);
    await _loadMe();
  }

  Future<void> signup({
    required String organizationName,
    required String name,
    required String email,
    required String password,
  }) async {
    final tokens = await _postJson("/api/auth/signup", {
      "organizationName": organizationName,
      "name": name,
      "email": email,
      "password": password,
    });
    await _persistTokens(tokens);
    await _loadMe();
  }

  Future<void> logout() async {
    final refresh = await _storage.read(key: _refreshKey);
    if (refresh != null) {
      try {
        await _postJson("/api/auth/logout", {"refreshToken": refresh});
      } catch (_) {
        // best-effort
      }
    }
    await _clear();
  }

  // ── Authenticated requests (used by AnalyticsApi) ────────────────────
  Future<dynamic> authFetch(
    String path, {
    String method = "GET",
    Map<String, dynamic>? body,
  }) async {
    Future<http.Response> send() => _sendAuthed(path, method, body);

    var res = await send();
    if (res.statusCode == 401) {
      final refresh = await _storage.read(key: _refreshKey);
      if (refresh != null) {
        try {
          await _refresh(refresh);
          res = await send();
        } catch (_) {
          await _clear();
        }
      }
    }
    return _decode(res);
  }

  Future<http.Response> _sendAuthed(
    String path,
    String method,
    Map<String, dynamic>? body,
  ) {
    final headers = {
      "Content-Type": "application/json",
      if (_accessToken != null) "Authorization": "Bearer $_accessToken",
    };
    final uri = _uri(path);
    final encoded = body == null ? null : jsonEncode(body);
    switch (method) {
      case "POST":
        return http.post(uri, headers: headers, body: encoded);
      case "DELETE":
        return http.delete(uri, headers: headers, body: encoded);
      default:
        return http.get(uri, headers: headers);
    }
  }

  // ── Internals ────────────────────────────────────────────────────────
  Future<Map<String, dynamic>> _postJson(
    String path,
    Map<String, dynamic> body,
  ) async {
    final res = await http.post(
      _uri(path),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode(body),
    );
    return _decode(res) as Map<String, dynamic>;
  }

  Future<void> _refresh(String refreshToken) async {
    final tokens = await _postJson("/api/auth/refresh", {
      "refreshToken": refreshToken,
    });
    await _persistTokens(tokens);
  }

  Future<void> _persistTokens(Map<String, dynamic> tokens) async {
    _accessToken = tokens["accessToken"] as String?;
    final refresh = tokens["refreshToken"] as String?;
    if (refresh != null) {
      await _storage.write(key: _refreshKey, value: refresh);
    }
  }

  Future<void> _loadMe() async {
    final me = await authFetch("/api/auth/me") as Map<String, dynamic>;
    user.value = AuthUser.fromJson(me);
  }

  Future<void> _clear() async {
    _accessToken = null;
    user.value = null;
    await _storage.delete(key: _refreshKey);
  }

  dynamic _decode(http.Response res) {
    dynamic parsed;
    if (res.body.isNotEmpty) {
      try {
        parsed = jsonDecode(res.body);
      } catch (_) {
        parsed = null;
      }
    }
    if (res.statusCode < 200 || res.statusCode >= 300) {
      final msg = parsed is Map<String, dynamic>
          ? (parsed["message"] is List
                ? (parsed["message"] as List).join(", ")
                : parsed["message"]?.toString())
          : null;
      throw ApiException(
        msg ?? "Request failed (${res.statusCode})",
        res.statusCode,
      );
    }
    return parsed;
  }
}
