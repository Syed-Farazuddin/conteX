import "package:flutter/foundation.dart";
import "package:flutter/material.dart";

import "../theme/app_text.dart";
import "../theme/app_theme.dart";

class StatusBanner extends StatelessWidget {
  const StatusBanner({
    super.key,
    required this.apiReachable,
    required this.message,
    this.apiBaseUrl,
    this.onRetry,
  });

  /// `true` = server responded but Replicate is not configured.
  final bool apiReachable;
  final String message;
  final String? apiBaseUrl;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final accent = apiReachable ? AppColors.amber : AppColors.error;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accent.withValues(alpha: 0.35)),
        gradient: LinearGradient(
          colors: [accent.withValues(alpha: 0.12), Colors.transparent],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                apiReachable
                    ? Icons.info_outline_rounded
                    : Icons.cloud_off_rounded,
                size: 18,
                color: accent,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  apiReachable ? "Setup required" : "Can't reach API",
                  style: AppText.title(context, size: 13),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(message, style: AppText.body(context, size: 13, height: 1.45)),
          if (kDebugMode && apiBaseUrl != null) ...[
            const SizedBox(height: 8),
            Text("Trying: $apiBaseUrl", style: AppText.caption(context)),
          ],
          if (onRetry != null) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text("Retry connection"),
                style: TextButton.styleFrom(foregroundColor: accent),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
