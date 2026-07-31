import 'package:flutter/material.dart';

class OriginitePainter extends CustomPainter {
  const OriginitePainter();

  @override
  void paint(Canvas canvas, Size size) {
    final scaleX = size.width / 100.0;
    final scaleY = size.height / 100.0;

    canvas.save();
    canvas.scale(scaleX, scaleY);

    final goldColor = const Color(0xFFE5B20D);

    final outlinePaint = Paint()
      ..color = goldColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.0
      ..strokeJoin = StrokeJoin.miter;

    final whitePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final goldFillPaint = Paint()
      ..color = goldColor
      ..style = PaintingStyle.fill;

    final stripePaint = Paint()
      ..color = goldColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5;

    // 1. Hexagon Outer Frame
    final hexPath = Path()
      ..moveTo(30, 8)
      ..lineTo(70, 8)
      ..lineTo(95, 50)
      ..lineTo(70, 92)
      ..lineTo(30, 92)
      ..lineTo(5, 50)
      ..close();

    canvas.drawPath(hexPath, outlinePaint);

    // 2. Solid White Top Facet
    final topFacet = Path()
      ..moveTo(35, 26)
      ..lineTo(68, 26)
      ..lineTo(78, 48)
      ..lineTo(50, 68)
      ..lineTo(35, 48)
      ..close();

    canvas.drawPath(topFacet, whitePaint);

    // 3. Bottom-Left Diagonal Shading Lines
    canvas.drawLine(const Offset(22, 65), const Offset(42, 85), stripePaint);
    canvas.drawLine(const Offset(30, 57), const Offset(50, 77), stripePaint);
    canvas.drawLine(const Offset(38, 49), const Offset(58, 69), stripePaint);
    canvas.drawLine(const Offset(46, 41), const Offset(66, 61), stripePaint);

    // 4. Center Diamond Core
    canvas.save();
    canvas.translate(62, 54);
    canvas.rotate(0.785398); // 45 degrees
    canvas.drawRect(const Rect.fromLTWH(-5, -5, 10, 10), goldFillPaint);
    canvas.restore();

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
