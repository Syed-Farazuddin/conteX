import "dart:io";

import "package:gal/gal.dart";
import "package:http/http.dart" as http;

class ImageDownloadException implements Exception {
  ImageDownloadException(this.message);
  final String message;

  @override
  String toString() => message;
}

class ImageDownloadService {
  ImageDownloadService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<void> saveToGallery(String imageUrl) async {
    if (!await Gal.hasAccess(toAlbum: true)) {
      final granted = await Gal.requestAccess(toAlbum: true);
      if (!granted) {
        throw ImageDownloadException(
          "Photo library access is required to save images.",
        );
      }
    }

    final response = await _client.get(Uri.parse(imageUrl));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ImageDownloadException("Could not download the image.");
    }

    await Gal.putImageBytes(response.bodyBytes);
  }

  Future<void> saveFileToGallery(String filePath) async {
    if (!await Gal.hasAccess(toAlbum: true)) {
      final granted = await Gal.requestAccess(toAlbum: true);
      if (!granted) {
        throw ImageDownloadException(
          "Photo library access is required to save images.",
        );
      }
    }
    final bytes = await File(filePath).readAsBytes();
    await Gal.putImageBytes(bytes);
  }

  Future<void> saveOutput({String? localPath, required String remoteUrl}) async {
    if (localPath != null && await File(localPath).exists()) {
      await saveFileToGallery(localPath);
      return;
    }
    await saveToGallery(remoteUrl);
  }

  void dispose() => _client.close();
}
