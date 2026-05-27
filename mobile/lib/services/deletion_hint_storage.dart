import "dart:convert";
import "dart:io";

import "package:path_provider/path_provider.dart";

class DeletionHintStorage {
  static const _fileName = "delete_hint_seen.json";

  static Future<File> _file() async {
    final dir = await getApplicationDocumentsDirectory();
    return File("${dir.path}/$_fileName");
  }

  static Future<bool> hasSeen() async {
    try {
      final file = await _file();
      if (!await file.exists()) return false;
      final raw = await file.readAsString();
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return json["seen"] == true;
    } catch (_) {
      return false;
    }
  }

  static Future<void> markSeen() async {
    try {
      final file = await _file();
      await file.writeAsString(jsonEncode({"seen": true}), flush: true);
    } catch (_) {
      // Best-effort: if it fails, we just show the hint again later.
    }
  }
}

