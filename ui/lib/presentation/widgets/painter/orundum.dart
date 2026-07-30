import 'package:flutter/material.dart';

class OrundumPainter extends CustomPainter {
  const OrundumPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final strokePaint = Paint()
      ..color = const Color(0xFFB32019)
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.square;

    final scaleX = size.width / 200.0;
    final scaleY = size.height / 200.0;

    canvas.save();
    canvas.scale(scaleX, scaleY);

    // 1. Outer Frame
    canvas.save();
    canvas.translate(100, 100);
    canvas.rotate(0.785398);
    canvas.translate(-100, -100);
    strokePaint.strokeWidth = 6;
    canvas.drawRect(const Rect.fromLTWH(35, 35, 130, 130), strokePaint);
    canvas.restore();

    // 2. Corner Extensions
    strokePaint.strokeWidth = 12;
    canvas.drawLine(const Offset(45, 45), const Offset(20, 20), strokePaint);
    canvas.drawLine(const Offset(155, 45), const Offset(180, 20), strokePaint);
    canvas.drawLine(const Offset(45, 155), const Offset(20, 180), strokePaint);
    canvas.drawLine(
      const Offset(155, 155),
      const Offset(180, 180),
      strokePaint,
    );

    strokePaint.strokeWidth = 8;
    canvas.drawLine(const Offset(42, 35), const Offset(35, 42), strokePaint);
    canvas.drawLine(const Offset(158, 35), const Offset(165, 42), strokePaint);
    canvas.drawLine(const Offset(42, 165), const Offset(35, 158), strokePaint);
    canvas.drawLine(
      const Offset(158, 165),
      const Offset(165, 158),
      strokePaint,
    );

    // 3. Inner Thick Diamond Ring
    canvas.save();
    canvas.translate(100, 100);
    canvas.rotate(0.785398);
    canvas.translate(-100, -100);
    strokePaint.strokeWidth = 16;
    canvas.drawRect(const Rect.fromLTWH(52, 52, 96, 96), strokePaint);
    canvas.restore();

    // 4. Center Diamond Core
    canvas.save();
    canvas.translate(100, 82);
    canvas.rotate(0.785398);
    canvas.translate(-100, -82);
    strokePaint.strokeWidth = 8;
    canvas.drawRect(const Rect.fromLTWH(88, 70, 24, 24), strokePaint);
    canvas.restore();

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
