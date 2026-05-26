import "package:flutter/material.dart";

import "../theme/app_theme.dart";

/// ConteX brand mark from [lib/assets/contex.png].
class AppLogo extends StatelessWidget {
  const AppLogo({
    super.key,
    this.size,
    this.width,
    this.height = 48,
    this.maxWidth,
    this.borderRadius = 12,
    this.fit = BoxFit.contain,
    this.alignment = Alignment.center,
    this.showShadow = false,
  }) : assert(size != null || width != null || height != null);

  /// Square logo (icon-style).
  const AppLogo.icon({
    super.key,
    double size = 48,
    double borderRadius = 14,
    bool showShadow = true,
  }) : size = size,
       width = null,
       height = size,
       maxWidth = null,
       borderRadius = borderRadius,
       fit = BoxFit.cover,
       alignment = Alignment.center,
       showShadow = showShadow;

  /// Wide wordmark for headers (preserves aspect ratio).
  const AppLogo.wordmark({
    super.key,
    this.height = 52,
    this.maxWidth,
    this.alignment = Alignment.centerLeft,
  }) : size = null,
       width = null,
       borderRadius = 0,
       fit = BoxFit.contain,
       showShadow = false;

  final double? size;
  final double? width;
  final double? height;
  final double? maxWidth;
  final double borderRadius;
  final BoxFit fit;
  final Alignment alignment;
  final bool showShadow;

  static const assetPath = "lib/assets/contex.png";

  @override
  Widget build(BuildContext context) {
    final resolvedWidth = size ?? width;
    final resolvedHeight = size ?? height ?? 48;

    Widget image = Image.asset(
      assetPath,
      width: resolvedWidth,
      height: resolvedHeight,
      fit: fit,
      alignment: alignment,
      filterQuality: FilterQuality.high,
      errorBuilder: (_, __, ___) => SizedBox(
        width: resolvedWidth ?? resolvedHeight,
        height: resolvedHeight,
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(borderRadius),
          ),
          child: Icon(
            Icons.auto_awesome_rounded,
            size: resolvedHeight * 0.45,
            color: AppColors.violet,
          ),
        ),
      ),
    );

    if (maxWidth != null) {
      image = ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth!),
        child: image,
      );
    }

    if (borderRadius <= 0 && !showShadow) {
      return Align(alignment: alignment, child: image);
    }

    return Container(
      width: resolvedWidth,
      height: resolvedHeight,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: showShadow
            ? [
                BoxShadow(
                  color: AppColors.violet.withValues(alpha: 0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ]
            : null,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: image,
      ),
    );
  }
}
