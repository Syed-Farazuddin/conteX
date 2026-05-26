import "dart:convert";
import "dart:typed_data";

import "package:http/http.dart" as http;

import "../config/api_config.dart";

class GenerationStyle {
  const GenerationStyle({
    required this.id,
    required this.label,
    required this.description,
    required this.emoji,
    required this.aspectRatio,
    required this.pipeline,
  });

  final String id;
  final String label;
  final String description;
  final String emoji;
  final String aspectRatio;
  final String pipeline;

  factory GenerationStyle.fromJson(Map<String, dynamic> json) {
    return GenerationStyle(
      id: json["id"] as String,
      label: json["label"] as String,
      description: json["description"] as String? ?? "",
      emoji: json["emoji"] as String? ?? "✨",
      aspectRatio: json["aspectRatio"] as String? ?? "1:1",
      pipeline: json["pipeline"] as String? ?? "image",
    );
  }
}

class GenerationResult {
  const GenerationResult({
    required this.styleId,
    required this.styleLabel,
    required this.sourceImageUrl,
    required this.outputUrl,
    required this.prompt,
    required this.generatedAt,
    this.outputBase64,
  });

  final String styleId;
  final String styleLabel;
  final String sourceImageUrl;
  final String outputUrl;
  final String prompt;
  final String generatedAt;
  final String? outputBase64;

  /// Decodes [outputBase64] from the API (`data:image/...;base64,...`).
  Uint8List? get outputBytes {
    final raw = outputBase64;
    if (raw == null || raw.isEmpty) return null;
    final comma = raw.indexOf(",");
    final payload = comma >= 0 ? raw.substring(comma + 1) : raw;
    try {
      final bytes = base64Decode(payload);
      return bytes.isEmpty ? null : bytes;
    } catch (_) {
      return null;
    }
  }

  factory GenerationResult.fromJson(Map<String, dynamic> json) {
    return GenerationResult(
      styleId: json["styleId"] as String,
      styleLabel: json["styleLabel"] as String,
      sourceImageUrl: json["sourceImageUrl"] as String? ?? "",
      outputUrl: json["outputUrl"] as String,
      prompt: json["prompt"] as String? ?? "",
      generatedAt: json["generatedAt"] as String? ?? "",
      outputBase64: json["outputBase64"] as String?,
    );
  }
}

class GenerationApi {
  GenerationApi({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Uri _uri(String path) => Uri.parse("$apiBaseUrl$path");

  Future<({bool configured, List<GenerationStyle> styles})>
  fetchStyles() async {
    final uri = _uri("/api/generate/styles");
    final res = await _client.get(uri).timeout(const Duration(seconds: 8));
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception("API returned ${res.statusCode} for $uri");
    }
    final body = jsonDecode(res.body) as Map<String, dynamic>;
    final list = body["styles"] as List<dynamic>? ?? [];
    return (
      configured: body["configured"] == true,
      styles: list
          .map((e) => GenerationStyle.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Future<GenerationResult> generate({
    required String imageBase64,
    required String styleId,
    String? prompt,
  }) async {
    final payload = <String, dynamic>{
      "styleId": styleId,
      "imageBase64": imageBase64.startsWith("data:")
          ? imageBase64
          : "data:image/jpeg;base64,$imageBase64",
      if (prompt != null && prompt.trim().isNotEmpty) "prompt": prompt.trim(),
    };

    final res = await _client
        .post(
          _uri("/api/generate"),
          headers: {"Content-Type": "application/json"},
          body: jsonEncode(payload),
        )
        .timeout(const Duration(minutes: 3));

    final body = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode < 200 ||
        res.statusCode >= 300 ||
        body["success"] != true ||
        body["data"] == null) {
      throw Exception(body["message"] as String? ?? "Generation failed");
    }

    return GenerationResult.fromJson(body["data"] as Map<String, dynamic>);
  }

  void dispose() => _client.close();
}
