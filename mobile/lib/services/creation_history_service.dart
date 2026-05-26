import "dart:convert";
import "dart:io";
import "dart:typed_data";

import "package:flutter/foundation.dart";
import "package:http/http.dart" as http;
import "package:path/path.dart" as p;
import "package:path_provider/path_provider.dart";

import "../api/generation_api.dart";
import "../config/api_config.dart";
import "../models/saved_creation.dart";

class CreationStorageException implements Exception {
  CreationStorageException(this.message);
  final String message;

  @override
  String toString() => message;
}

/// Persists generations under app documents. Use [instance] so index state stays consistent.
class CreationHistoryService {
  CreationHistoryService._({http.Client? client})
    : _client = client ?? http.Client();

  static final CreationHistoryService instance = CreationHistoryService._();

  factory CreationHistoryService({http.Client? client}) {
    if (client != null) return CreationHistoryService._(client: client);
    return instance;
  }

  static const _maxItems = 40;
  static const _indexFileName = "index.json";
  static const _stagingDirName = "staging";
  static const _outputFileName = "output.jpg";

  final http.Client _client;

  Future<Directory> _rootDir() async {
    try {
      final docs = await getApplicationDocumentsDirectory();
      final dir = Directory(p.join(docs.path, "creations"));
      if (!await dir.exists()) {
        await dir.create(recursive: true);
      }
      return dir;
    } catch (e) {
      debugPrint("Gallery storage unavailable: $e");
      throw CreationStorageException(
        "Local storage unavailable — fully quit the app and open it again",
      );
    }
  }

  Future<File> _indexFile() async {
    final root = await _rootDir();
    return File(p.join(root.path, _indexFileName));
  }

  String _folderPath(Directory root, String id) => p.join(root.path, id);

  String _outputPath(Directory root, String id) =>
      p.join(_folderPath(root, id), _outputFileName);

  String _inputPath(Directory root, String id, String inputFileName) =>
      p.join(_folderPath(root, id), inputFileName);

  Future<List<SavedCreation>> _readIndexRaw() async {
    try {
      final file = await _indexFile();
      if (!await file.exists()) return [];

      final list = jsonDecode(await file.readAsString()) as List<dynamic>;
      return list
          .map((e) => SavedCreation.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint("Failed to read gallery index: $e");
      return [];
    }
  }

  /// Resolves stored entries to files in the current app container.
  Future<SavedCreation?> _resolveEntry(
    SavedCreation entry,
    Directory root,
  ) async {
    final outputFile = File(_outputPath(root, entry.id));
    if (!await outputFile.exists()) {
      // Legacy index stored absolute paths — try basename under id folder.
      final legacy = File(entry.outputPath);
      if (legacy.path.isNotEmpty && await legacy.exists()) {
        return entry.withResolvedPaths(
          outputPath: legacy.path,
          inputPath: await _findInputPath(root, entry.id, entry.inputFileName),
        );
      }
      return null;
    }

    final inputPath = await _findInputPath(root, entry.id, entry.inputFileName);
    return entry.withResolvedPaths(
      outputPath: outputFile.path,
      inputPath: inputPath,
    );
  }

  Future<String> _findInputPath(
    Directory root,
    String id,
    String preferredName,
  ) async {
    final preferred = File(_inputPath(root, id, preferredName));
    if (await preferred.exists()) return preferred.path;

    final folder = Directory(_folderPath(root, id));
    if (!await folder.exists()) return preferred.path;

    await for (final entity in folder.list()) {
      if (entity is! File) continue;
      final name = p.basename(entity.path);
      if (name.startsWith("input")) return entity.path;
    }
    return preferred.path;
  }

  Future<List<SavedCreation>> loadAll() async {
    final root = await _rootDir();
    final stored = await _readIndexRaw();
    final valid = <SavedCreation>[];

    for (final entry in stored) {
      final resolved = await _resolveEntry(entry, root);
      if (resolved != null) {
        valid.add(resolved);
      }
    }

    valid.sort((a, b) => b.createdAt.compareTo(a.createdAt));

    if (valid.length != stored.length) {
      await _writeIndex(valid);
    }

    await _pruneOrphans(valid.map((c) => c.id).toSet(), root);

    debugPrint("Gallery loaded ${valid.length} creation(s)");
    return valid;
  }

  Future<void> _writeIndex(List<SavedCreation> items) async {
    final file = await _indexFile();
    final encoded = jsonEncode(items.map((e) => e.toJson()).toList());
    await file.writeAsString(encoded, flush: true);
  }

  Future<Uint8List> _fetchBytes(Uri uri) async {
    final response = await _client
        .get(uri, headers: const {"User-Agent": "ConteX-Mobile/1.0"})
        .timeout(const Duration(seconds: 90));
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.bodyBytes.isNotEmpty) return response.bodyBytes;
      throw CreationStorageException("Downloaded image was empty");
    }
    throw CreationStorageException("HTTP ${response.statusCode}");
  }

  Future<Uint8List> _downloadViaBackend(String url) async {
    final uri = Uri.parse(
      "$apiBaseUrl/api/generate/asset",
    ).replace(queryParameters: {"url": url});
    return _fetchBytes(uri);
  }

  Future<Uint8List> _downloadOutput(String url) async {
    Object? lastError;
    for (var attempt = 0; attempt < 3; attempt++) {
      try {
        return await _downloadViaBackend(url);
      } catch (e) {
        lastError = e;
      }
      try {
        return await _fetchBytes(Uri.parse(url));
      } catch (e) {
        lastError = e;
      }
      await Future<void>.delayed(Duration(milliseconds: 400 * (attempt + 1)));
    }
    throw CreationStorageException(
      "Could not download generated image: $lastError",
    );
  }

  Future<String> stageInputFile(String sourcePath) async {
    final source = File(sourcePath);
    if (!await source.exists()) {
      throw CreationStorageException("Source photo no longer available");
    }
    final root = await _rootDir();
    final staging = Directory(p.join(root.path, _stagingDirName));
    if (!await staging.exists()) await staging.create(recursive: true);
    final ext = _fileExtension(sourcePath);
    final dest = File(
      p.join(staging.path, "${DateTime.now().millisecondsSinceEpoch}$ext"),
    );
    await source.copy(dest.path);
    return dest.path;
  }

  Future<SavedCreation> save({
    String? inputSourcePath,
    Uint8List? inputBytes,
    Uint8List? outputBytes,
    required String outputUrl,
    required GenerationStyle style,
    required GenerationResult result,
  }) async {
    if (outputUrl.trim().isEmpty) {
      throw CreationStorageException("Missing output image URL");
    }

    final root = await _rootDir();
    final id = DateTime.now().millisecondsSinceEpoch.toString();
    final folder = Directory(_folderPath(root, id));
    await folder.create(recursive: true);

    final bytes = outputBytes ?? await _downloadOutput(outputUrl);
    final outputPath = _outputPath(root, id);
    await File(outputPath).writeAsBytes(bytes);

    var inputFileName = _outputFileName;
    var inputPath = outputPath;

    if (inputBytes != null && inputBytes.isNotEmpty) {
      inputFileName = "input.jpg";
      inputPath = _inputPath(root, id, inputFileName);
      await File(inputPath).writeAsBytes(inputBytes);
    } else if (inputSourcePath != null) {
      final source = File(inputSourcePath);
      if (await source.exists()) {
        inputFileName = "input${_fileExtension(inputSourcePath)}";
        inputPath = _inputPath(root, id, inputFileName);
        await source.copy(inputPath);
      }
    }

    if (!await File(outputPath).exists()) {
      throw CreationStorageException("Output file was not written");
    }

    final creation = SavedCreation(
      id: id,
      styleId: style.id,
      styleLabel: style.label,
      styleEmoji: style.emoji,
      styleDescription: style.description,
      inputFileName: inputFileName,
      inputPath: inputPath,
      outputPath: outputPath,
      createdAt: result.generatedAt.isNotEmpty
          ? result.generatedAt
          : DateTime.now().toUtc().toIso8601String(),
      remoteOutputUrl: outputUrl,
    );

    final existing = await _readIndexRaw();
    final merged = [creation, ...existing.where((c) => c.id != id)];
    final updated = merged.take(_maxItems).toList();

    await _writeIndex(updated);

    final droppedIds = merged.skip(_maxItems).map((c) => c.id).toSet();
    for (final droppedId in droppedIds) {
      final dir = Directory(_folderPath(root, droppedId));
      if (await dir.exists()) await dir.delete(recursive: true);
    }

    debugPrint(
      "Gallery saved id=$id (${bytes.length} bytes), index=${updated.length}",
    );
    return creation;
  }

  Future<void> delete(String id) async {
    final root = await _rootDir();
    final folder = Directory(_folderPath(root, id));
    if (await folder.exists()) {
      await folder.delete(recursive: true);
    }
    final updated = (await _readIndexRaw()).where((c) => c.id != id).toList();
    await _writeIndex(updated);
    await _pruneOrphans(updated.map((c) => c.id).toSet(), root);
  }

  Future<void> _pruneOrphans(Set<String> allowedIds, Directory root) async {
    if (!await root.exists()) return;
    await for (final entity in root.list()) {
      if (entity is! Directory) continue;
      final name = p.basename(entity.path);
      if (name.isEmpty || name == _stagingDirName) continue;
      if (!allowedIds.contains(name)) {
        await entity.delete(recursive: true);
      }
    }
  }

  String _fileExtension(String path) {
    final ext = p.extension(path).toLowerCase();
    if (ext.isEmpty || ext.length > 5) return ".jpg";
    return ext;
  }

  void dispose() {
    // Shared singleton must not close the client while the app is running.
  }
}
