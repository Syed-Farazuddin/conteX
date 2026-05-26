import "dart:math" as math;

import "package:flutter/material.dart";
import "package:google_fonts/google_fonts.dart";

import "../app/app_routes.dart";
import "../theme/app_theme.dart";
import "../widgets/app_logo.dart";

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _main;
  late final AnimationController _pulse;
  late final AnimationController _shimmer;

  @override
  void initState() {
    super.initState();

    _main = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    );
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);
    _shimmer = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();

    _main.forward();
    _main.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _openHome();
      }
    });
  }

  Future<void> _openHome() async {
    await Future<void>.delayed(const Duration(milliseconds: 200));
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed(AppRoutes.landing);
  }

  @override
  void dispose() {
    _main.dispose();
    _pulse.dispose();
    _shimmer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final logoIn = CurvedAnimation(
      parent: _main,
      curve: const Interval(0.08, 0.45, curve: Curves.easeOutCubic),
    );
    final textIn = CurvedAnimation(
      parent: _main,
      curve: const Interval(0.35, 0.62, curve: Curves.easeOut),
    );
    final loaderIn = CurvedAnimation(
      parent: _main,
      curve: const Interval(0.5, 0.75, curve: Curves.easeOut),
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        fit: StackFit.expand,
        children: [
          const _SplashBackdrop(),
          AnimatedBuilder(
            animation: Listenable.merge([_pulse, _main]),
            builder: (context, _) {
              final glow = 0.35 + _pulse.value * 0.25;
              return Center(
                child: Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.violet.withValues(alpha: glow * 0.5),
                        blurRadius: 80 + _pulse.value * 30,
                        spreadRadius: 10,
                      ),
                      BoxShadow(
                        color: AppColors.fuchsia.withValues(alpha: glow * 0.25),
                        blurRadius: 100,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          SafeArea(
            child: Column(
              children: [
                const Spacer(flex: 3),
                FadeTransition(
                  opacity: logoIn,
                  child: ScaleTransition(
                    scale: Tween<double>(begin: 0.88, end: 1).animate(logoIn),
                    child: const AppLogo.wordmark(
                      height: 72,
                      maxWidth: 280,
                      alignment: Alignment.center,
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                FadeTransition(
                  opacity: textIn,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.15),
                      end: Offset.zero,
                    ).animate(textIn),
                    child: Column(
                      children: [
                        _AiTagline(shimmer: _shimmer),
                        const SizedBox(height: 10),
                        Text(
                          "Ghibli · Anime · Cinematic · More",
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            letterSpacing: 0.4,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(flex: 2),
                FadeTransition(opacity: loaderIn, child: const _SplashLoader()),
                const SizedBox(height: 48),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SplashBackdrop extends StatelessWidget {
  const _SplashBackdrop();

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF050508),
                Color(0xFF0D0A18),
                Color(0xFF080612),
                Color(0xFF050508),
              ],
              stops: [0, 0.35, 0.7, 1],
            ),
          ),
        ),
        Positioned(
          top: -120,
          right: -80,
          child: _glowOrb(260, AppColors.violet, 0.2),
        ),
        Positioned(
          bottom: -100,
          left: -60,
          child: _glowOrb(220, AppColors.fuchsia, 0.16),
        ),
        const Positioned.fill(child: CustomPaint(painter: _AiMeshPainter())),
      ],
    );
  }

  Widget _glowOrb(double size, Color color, double alpha) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            color.withValues(alpha: alpha),
            Colors.transparent,
          ],
        ),
      ),
    );
  }
}

/// Subtle neural-style grid for an AI studio feel.
class _AiMeshPainter extends CustomPainter {
  const _AiMeshPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.6;

    const cols = 14;
    const rows = 22;
    final dx = size.width / cols;
    final dy = size.height / rows;

    for (var c = 0; c <= cols; c++) {
      final x = c * dx;
      paint.color = AppColors.violet.withValues(
        alpha: 0.04 + (c / cols) * 0.06,
      );
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (var r = 0; r <= rows; r++) {
      final y = r * dy;
      paint.color = AppColors.fuchsia.withValues(
        alpha: 0.03 + (r / rows) * 0.05,
      );
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    final nodePaint = Paint()..style = PaintingStyle.fill;
    final random = math.Random(42);
    for (var i = 0; i < 28; i++) {
      final x = random.nextDouble() * size.width;
      final y = random.nextDouble() * size.height;
      nodePaint.color = AppColors.violet.withValues(
        alpha: 0.08 + random.nextDouble() * 0.12,
      );
      canvas.drawCircle(
        Offset(x, y),
        1.2 + random.nextDouble() * 1.5,
        nodePaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _AiTagline extends StatelessWidget {
  const _AiTagline({required this.shimmer});

  final Animation<double> shimmer;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: shimmer,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (bounds) {
            final slide = shimmer.value * 2 - 0.5;
            return LinearGradient(
              begin: Alignment(slide - 1, 0),
              end: Alignment(slide, 0),
              colors: const [
                AppColors.textSecondary,
                Color(0xFFE9D5FF),
                AppColors.violet,
                AppColors.textSecondary,
              ],
              stops: const [0.1, 0.45, 0.55, 0.9],
            ).createShader(bounds);
          },
          blendMode: BlendMode.srcIn,
          child: child,
        );
      },
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.auto_awesome_rounded,
            size: 16,
            color: AppColors.violet.withValues(alpha: 0.9),
          ),
          const SizedBox(width: 8),
          Text(
            "AI photo studio",
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.2,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}

class _SplashLoader extends StatefulWidget {
  const _SplashLoader();

  @override
  State<_SplashLoader> createState() => _SplashLoaderState();
}

class _SplashLoaderState extends State<_SplashLoader>
    with SingleTickerProviderStateMixin {
  late final AnimationController _dots;

  @override
  void initState() {
    super.initState();
    _dots = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
  }

  @override
  void dispose() {
    _dots.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _dots,
      builder: (context, _) {
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(3, (i) {
            final phase = (_dots.value + i * 0.2) % 1.0;
            final scale = 0.6 + math.sin(phase * math.pi) * 0.5;
            final opacity = 0.35 + math.sin(phase * math.pi) * 0.65;
            return Container(
              margin: const EdgeInsets.symmetric(horizontal: 5),
              width: 8 * scale,
              height: 8 * scale,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.violet.withValues(alpha: opacity),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.fuchsia.withValues(alpha: opacity * 0.5),
                    blurRadius: 8,
                  ),
                ],
              ),
            );
          }),
        );
      },
    );
  }
}
