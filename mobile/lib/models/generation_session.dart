import "dart:io";
import "dart:typed_data";

import "../api/generation_api.dart";
import "saved_creation.dart";

/// Data passed from studio → result screen after a successful generation.
class GenerationSession {
  const GenerationSession({
    required this.result,
    required this.style,
    this.localImagePath,
    this.localOutputPath,
    this.savedCreationId,
    this.inputBytes,
  });

  final GenerationResult result;
  final GenerationStyle style;
  final String? localImagePath;
  final String? localOutputPath;
  final String? savedCreationId;
  final Uint8List? inputBytes;

  String get outputImageSource => localOutputPath ?? result.outputUrl;

  bool get hasLocalOutput =>
      localOutputPath != null && File(localOutputPath!).existsSync();

  /// True when a distinct original file exists on disk for before/after toggle.
  bool get hasOriginalPhoto {
    final path = localImagePath;
    if (path == null || path.isEmpty) return false;
    if (path == localOutputPath) return false;
    return File(path).existsSync();
  }

  factory GenerationSession.fromSaved(SavedCreation saved) {
    return GenerationSession(
      result: GenerationResult(
        styleId: saved.styleId,
        styleLabel: saved.styleLabel,
        sourceImageUrl: "",
        outputUrl: saved.remoteOutputUrl ?? "",
        prompt: "",
        generatedAt: saved.createdAt,
      ),
      style: GenerationStyle(
        id: saved.styleId,
        label: saved.styleLabel,
        description: saved.styleDescription,
        emoji: saved.styleEmoji,
        aspectRatio: "1:1",
        pipeline: "image",
      ),
      localImagePath: saved.inputFileName != "output.jpg"
          ? saved.inputPath
          : null,
      localOutputPath: saved.outputPath,
      savedCreationId: saved.id,
    );
  }
}
