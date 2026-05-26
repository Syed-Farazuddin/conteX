/// A generation saved on device under `Documents/creations/<id>/`.
///
/// Index JSON stores [id] and filenames only — paths are resolved at runtime
/// so gallery survives app restarts (no stale absolute paths).
class SavedCreation {
  const SavedCreation({
    required this.id,
    required this.styleId,
    required this.styleLabel,
    required this.styleEmoji,
    required this.styleDescription,
    required this.inputFileName,
    required this.outputPath,
    required this.inputPath,
    required this.createdAt,
    this.remoteOutputUrl,
  });

  final String id;
  final String styleId;
  final String styleLabel;
  final String styleEmoji;
  final String styleDescription;
  final String inputFileName;
  final String outputPath;
  final String inputPath;
  final String createdAt;
  final String? remoteOutputUrl;

  Map<String, dynamic> toJson() => {
    "id": id,
    "styleId": styleId,
    "styleLabel": styleLabel,
    "styleEmoji": styleEmoji,
    "styleDescription": styleDescription,
    "inputFileName": inputFileName,
    "createdAt": createdAt,
    if (remoteOutputUrl != null) "remoteOutputUrl": remoteOutputUrl,
  };

  factory SavedCreation.fromJson(Map<String, dynamic> json) {
    final id = json["id"] as String;
    var inputFileName = json["inputFileName"] as String? ?? "input.jpg";
    final legacyInput = json["inputPath"] as String?;
    if (json["inputFileName"] == null &&
        legacyInput != null &&
        legacyInput.isNotEmpty) {
      final slash = legacyInput.lastIndexOf("/");
      inputFileName = slash >= 0
          ? legacyInput.substring(slash + 1)
          : legacyInput;
    }
    return SavedCreation(
      id: id,
      styleId: json["styleId"] as String,
      styleLabel: json["styleLabel"] as String,
      inputFileName: inputFileName,
      styleEmoji: json["styleEmoji"] as String? ?? "✨",
      styleDescription: json["styleDescription"] as String? ?? "",
      outputPath: json["outputPath"] as String? ?? "",
      inputPath: json["inputPath"] as String? ?? "",
      createdAt: json["createdAt"] as String,
      remoteOutputUrl: json["remoteOutputUrl"] as String?,
    );
  }

  SavedCreation withResolvedPaths({
    required String outputPath,
    required String inputPath,
  }) {
    return SavedCreation(
      id: id,
      styleId: styleId,
      styleLabel: styleLabel,
      styleEmoji: styleEmoji,
      styleDescription: styleDescription,
      inputFileName: inputFileName,
      outputPath: outputPath,
      inputPath: inputPath,
      createdAt: createdAt,
      remoteOutputUrl: remoteOutputUrl,
    );
  }
}
