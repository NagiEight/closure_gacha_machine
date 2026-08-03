import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
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
  bool _wasFull = false;
  late final FlutterLocalNotificationsPlugin _notificationsPlugin;

  @override
  void initState() {
    super.initState();
    _initNotifications();
    _lastSavedAt = DateTime.now();
    _loadTimer();
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  Future<void> _initNotifications() async {
    _notificationsPlugin = FlutterLocalNotificationsPlugin();
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const iosSettings = DarwinInitializationSettings();
    const linuxSettings = LinuxInitializationSettings(
      defaultActionName: 'Open notification',
    );
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
      linux: linuxSettings,
    );
    await _notificationsPlugin.initialize(settings: initSettings);
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
        _lastSavedAt = DateTime.now();
      }
      _wasFull = _currentSanity >= widget.maxSanity;
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

      final isNowFull = updatedSanity >= widget.maxSanity;
      if (isNowFull && !_wasFull) {
        _sendSanityNotification();
      }

      setState(() {
        _currentSanity = updatedSanity;
        _lastSavedAt = _lastSavedAt!.add(Duration(seconds: recovered * 360));
        _wasFull = isNowFull;
      });
    } else {
      setState(() {});
    }
  }

  Future<void> _sendSanityNotification() async {
    const androidDetails = AndroidNotificationDetails(
      'sanity_channel',
      'Sanity Timer',
      channelDescription: 'Notifications for when Sanity is full',
      importance: Importance.max,
      priority: Priority.high,
    );
    const iosDetails = DarwinNotificationDetails();
    const linuxDetails = LinuxNotificationDetails();
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
      linux: linuxDetails,
    );

    await _notificationsPlugin.show(
      id: 0,
      title: '[Sanity Full]',
      body: 'Your Sanity has reached maximum capacity',
      notificationDetails: details,
    );
  }

  Future<void> _saveSanity(int newSanity) async {
    final now = DateTime.now();
    final isNowFull = newSanity >= widget.maxSanity;
    setState(() {
      _currentSanity = newSanity;
      _lastSavedAt = now;
      _wasFull = isNowFull;
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

  void _showResetModal() {
    final sanityController = TextEditingController(text: '0');
    final minutesController = TextEditingController(text: '0');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1E1E1E),
        title: const Text(
          'Custom Sanity Reset',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: sanityController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Target Sanity',
                labelStyle: TextStyle(color: Colors.white54),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.white24),
                ),
                focusedBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.amber),
                ),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: minutesController,
              keyboardType: TextInputType.number,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Minutes Ago (Offset)',
                labelStyle: TextStyle(color: Colors.white54),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.white24),
                ),
                focusedBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.amber),
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancel',
              style: TextStyle(color: Colors.white54),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.amber,
              foregroundColor: Colors.black,
            ),
            onPressed: () {
              final sanity =
                  int.tryParse(sanityController.text) ?? _currentSanity;
              final minutes = int.tryParse(minutesController.text) ?? 0;

              final targetSanity = sanity.clamp(0, widget.maxSanity);
              final adjustedTime = DateTime.now().subtract(
                Duration(minutes: minutes),
              );

              setState(() {
                _currentSanity = targetSanity;
                _lastSavedAt = adjustedTime;
                _wasFull = targetSanity >= widget.maxSanity;
              });

              final timer = SanityTimer(
                id: 'default',
                label: 'Sanity Recovery',
                targetSanity: widget.maxSanity,
                currentSanity: targetSanity,
                createdAt: adjustedTime,
              );
              widget.timerRepository.saveTimer(timer);

              Navigator.pop(context);
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
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
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E1E1E),
                          foregroundColor: primaryColor,
                          side: BorderSide(
                            color: primaryColor.withValues(alpha: 0.5),
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onPressed: _showResetModal,
                        icon: const Icon(Icons.edit, size: 18),
                        label: const Text('Custom Reset'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E1E1E),
                          foregroundColor: Colors.amber,
                          side: const BorderSide(color: Colors.amberAccent),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        onPressed: () {
                          _saveSanity(widget.maxSanity);
                          _sendSanityNotification();
                        },
                        icon: const Icon(Icons.bolt, size: 18),
                        label: const Text('Test Full'),
                      ),
                    ],
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
