import "package:flutter/material.dart";

import "../widgets/image_preview_dialog.dart";

class ImageViewerArgs {
  const ImageViewerArgs({
    required this.imageUrl,
    required this.title,
    this.localPath,
    this.subtitle,
  });

  final String imageUrl;
  final String? localPath;
  final String title;
  final String? subtitle;
}

/// Legacy route wrapper — opens the same popup dialog used on the result screen.
class ImageViewerScreen extends StatelessWidget {
  const ImageViewerScreen({super.key, required this.args});

  final ImageViewerArgs args;

  @override
  Widget build(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!context.mounted) return;
      showImagePreviewDialog(
        context,
        localPath: args.localPath,
        remoteUrl: args.imageUrl,
        title: args.title,
        subtitle: args.subtitle,
      ).then((_) {
        if (context.mounted) Navigator.of(context).pop();
      });
    });

    return const Scaffold(
      backgroundColor: Colors.black,
      body: SizedBox.shrink(),
    );
  }
}
