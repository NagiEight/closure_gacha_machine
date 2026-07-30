import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/repositories/sanity_timer_repository.dart';
import 'package:ui/presentation/painter/sanity.dart';

class SanityTimerPage extends StatefulWidget {
  final SanityTimerRepository timerRepository;
  final int maxSanity;

  const SanityTimerPage({
    super.key,
    required this.timerRepository,
    this.maxSanity = 175,
  });

  @override
  State<SanityTimerPage> createState() => _SanityTimerPageState();
}

class _SanityTimerPageState extends State<SanityTimerPage> {
  int _currentSanity = 175;
  DateTime? _lastSavedAt;
  Timer? _ticker;

  @override
  void initState() {
    super.initState();
    _lastSavedAt = DateTime.now(); // Initialize this immediately, peon!
    _loadTimer();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  @override
  void dispose() {
    _ticker?.cancel();
    super.dispose();
  }

  Future<void> _loadTimer() async {
    final timer = await widget.timerRepository.getTimer();
    if (!mounted) return;

    setState(() {
      if (timer != null) {
        _currentSanity = timer.currentSanity;
        _lastSavedAt = timer.createdAt;
      } else {
        _lastSavedAt =
            DateTime.now(); // Fallback so the clock starts ticking immediately!
      }
    });
  }

  void _tick() {
    if (_lastSavedAt == null || _currentSanity >= widget.maxSanity) return;

    final now = DateTime.now();
    final elapsedSeconds = now.difference(_lastSavedAt!).inSeconds;
    final recovered = elapsedSeconds ~/ 360; // 6 minutes = 360 seconds

    if (recovered > 0) {
      final updatedSanity = (_currentSanity + recovered).clamp(
        0,
        widget.maxSanity,
      );
      setState(() {
        _currentSanity = updatedSanity;
        _lastSavedAt = _lastSavedAt!.add(Duration(seconds: recovered * 360));
      });
    } else {
      // Re-trigger rebuild to update second-by-second countdown
      setState(() {});
    }
  }

  Future<void> _saveSanity(int newSanity) async {
    final now = DateTime.now();
    setState(() {
      _currentSanity = newSanity;
      _lastSavedAt = now;
    });
    final timer = SanityTimer(
      id: 'default',
      label: 'Sanity Recovery',
      targetSanity: widget.maxSanity,
      currentSanity: newSanity,
      createdAt: now,
    );
    await widget.timerRepository.saveTimer(timer);
  }

  void _updateSanityFromPan(Offset localPosition, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final dx = localPosition.dx - center.dx;
    final dy = localPosition.dy - center.dy;

    var angle = math.atan2(dy, dx) + math.pi / 2;
    if (angle < 0) {
      angle += 2 * math.pi;
    }

    final progress = (angle / (2 * math.pi)).clamp(0.0, 1.0);
    final calculatedSanity = (progress * widget.maxSanity).round();
    _saveSanity(calculatedSanity.clamp(0, widget.maxSanity));
  }

  String _formatRemainingTime() {
    if (_currentSanity >= widget.maxSanity) return 'Sanity Full!';

    final remainingSanityNeeded = widget.maxSanity - _currentSanity;
    final now = DateTime.now();
    final secondsIntoCurrentCycle = _lastSavedAt != null
        ? now.difference(_lastSavedAt!).inSeconds % 360
        : 0;
    final secondsUntilNextSanity = 360 - secondsIntoCurrentCycle;

    final totalRemainingSeconds =
        ((remainingSanityNeeded - 1) * 360) + secondsUntilNextSanity;

    final hours = totalRemainingSeconds ~/ 3600;
    final minutes = (totalRemainingSeconds % 3600) ~/ 60;
    final seconds = totalRemainingSeconds % 60;

    final hoursStr = hours > 0 ? '${hours}h ' : '';
    final minutesStr = '${minutes.toString().padLeft(2, '0')}m ';
    final secondsStr = '${seconds.toString().padLeft(2, '0')}s';

    return 'Time to Full: $hoursStr$minutesStr$secondsStr';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = theme.colorScheme.primary;

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      body: Stack(
        children: [
          Positioned.fill(
            child: Opacity(
              opacity: 0.15,
              child: CustomPaint(painter: SanityPainter()),
            ),
          ),
          SafeArea(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(
                    width: 260,
                    height: 260,
                    child: LayoutBuilder(
                      builder: (context, constraints) {
                        final size = Size(
                          constraints.maxWidth,
                          constraints.maxHeight,
                        );
                        return GestureDetector(
                          onPanUpdate: (details) =>
                              _updateSanityFromPan(details.localPosition, size),
                          onPanDown: (details) =>
                              _updateSanityFromPan(details.localPosition, size),
                          child: CustomPaint(
                            size: size,
                            painter: _SanityCircularSliderPainter(
                              currentSanity: _currentSanity,
                              maxSanity: widget.maxSanity,
                              activeColor: primaryColor,
                            ),
                            child: Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Row(
                                    mainAxisSize: MainAxisSize.min,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.baseline,
                                    textBaseline: TextBaseline.alphabetic,
                                    children: [
                                      Text(
                                        '$_currentSanity',
                                        style: TextStyle(
                                          fontSize: 48,
                                          fontWeight: FontWeight.bold,
                                          color: primaryColor,
                                        ),
                                      ),
                                      Text(
                                        '/${widget.maxSanity}',
                                        style: TextStyle(
                                          fontSize: 20,
                                          color: Colors.white.withValues(
                                            alpha: 0.5,
                                          ),
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'SANITY',
                                    style: TextStyle(
                                      fontSize: 12,
                                      letterSpacing: 2,
                                      color: Colors.white.withValues(
                                        alpha: 0.6,
                                      ),
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 32),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF1E1E1E),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFF2A2A2A)),
                    ),
                    child: Text(
                      _formatRemainingTime(),
                      style: TextStyle(
                        color: _currentSanity == widget.maxSanity
                            ? primaryColor
                            : Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SanityCircularSliderPainter extends CustomPainter {
  final int currentSanity;
  final int maxSanity;
  final Color activeColor;

  _SanityCircularSliderPainter({
    required this.currentSanity,
    required this.maxSanity,
    required this.activeColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.min(size.width, size.height) / 2 - 16;
    const strokeWidth = 14.0;

    final bgPaint = Paint()
      ..color = const Color(0xFF2A2A2A)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    final progress = currentSanity / maxSanity;
    final sweepAngle = 2 * math.pi * progress;

    if (progress > 0) {
      final activePaint = Paint()
        ..color = activeColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        sweepAngle,
        false,
        activePaint,
      );
    }

    final thumbAngle = -math.pi / 2 + sweepAngle;
    final thumbCenter = Offset(
      center.dx + radius * math.cos(thumbAngle),
      center.dy + radius * math.sin(thumbAngle),
    );

    final thumbPaint = Paint()..color = Colors.white;
    final thumbOutlinePaint = Paint()
      ..color = activeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    canvas.drawCircle(thumbCenter, 10, thumbPaint);
    canvas.drawCircle(thumbCenter, 10, thumbOutlinePaint);
  }

  @override
  bool shouldRepaint(covariant _SanityCircularSliderPainter oldDelegate) {
    return oldDelegate.currentSanity != currentSanity ||
        oldDelegate.maxSanity != maxSanity ||
        oldDelegate.activeColor != activeColor;
  }
}
