import 'package:flutter/material.dart';

class PermitTenPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double scaleX = size.width / 160.0;
    final double scaleY = size.height / 100.0;

    // Card Outer Frame Body
    canvas.drawRect(
      Rect.fromLTWH(5 * scaleX, 5 * scaleY, 150 * scaleX, 90 * scaleY),
      Paint()..color = const Color(0xFF181818),
    );

    // Inner Border Line
    canvas.drawRect(
      Rect.fromLTWH(9 * scaleX, 9 * scaleY, 142 * scaleX, 82 * scaleY),
      Paint()
        ..color = const Color(0xFFFFC800)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.0 * scaleX,
    );

    // Middle-Left Yellow Banner
    canvas.drawRect(
      Rect.fromLTWH(40 * scaleX, 9 * scaleY, 50 * scaleX, 82 * scaleY),
      Paint()..color = const Color(0xFFFFC800),
    );

    // Icon Paint
    final iconPaint = Paint()
      ..color = const Color(0xFF0099FF)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5 * scaleX
      ..strokeCap = StrokeCap.butt;

    // Circle
    canvas.drawCircle(Offset(65 * scaleX, 50 * scaleY), 12 * scaleX, iconPaint);

    // Crosshair Lines
    canvas.drawLine(
      Offset(65 * scaleX, 32 * scaleY),
      Offset(65 * scaleX, 44 * scaleY),
      iconPaint,
    );
    canvas.drawLine(
      Offset(65 * scaleX, 56 * scaleY),
      Offset(65 * scaleX, 68 * scaleY),
      iconPaint,
    );
    canvas.drawLine(
      Offset(47 * scaleX, 50 * scaleY),
      Offset(59 * scaleX, 50 * scaleY),
      iconPaint,
    );
    canvas.drawLine(
      Offset(71 * scaleX, 50 * scaleY),
      Offset(83 * scaleX, 50 * scaleY),
      iconPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
