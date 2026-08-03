import 'dart:math';
import 'dart:ui';
import 'package:flutter/material.dart';

class ShardClipper extends CustomClipper<Path> {
  final double progress; // 0.0 = fully covered, 1.0 = fully disappeared
  final int seed;

  ShardClipper({required this.progress, required this.seed});

  @override
  Path getClip(Size size) {
    if (progress >= 1.0) return Path(); // Fully revealed
    if (progress <= 0.0)
      return Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height));

    final path = Path();
    final rand = Random(seed);

    // Divide grid into triangular shards
    const rows = 4;
    const cols = 2;
    final cellWidth = size.width / cols;
    final cellHeight = size.height / rows;

    // Generate random internal vertices
    final points = <List<Point<double>>>[];
    for (int r = 0; r <= rows; r++) {
      final rowPoints = <Point<double>>[];
      for (int c = 0; c <= cols; c++) {
        double x = c * cellWidth;
        double y = r * cellHeight;
        // Jitter inner points for organic polygon shapes
        if (c > 0 && c < cols)
          x += (rand.nextDouble() - 0.5) * (cellWidth * 0.4);
        if (r > 0 && r < rows)
          y += (rand.nextDouble() - 0.5) * (cellHeight * 0.4);
        rowPoints.add(Point(x, y));
      }
      points.add(rowPoints);
    }

    // Assign a fixed random threshold to each polygon shard
    int shardIndex = 0;
    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final p1 = points[r][c];
        final p2 = points[r][c + 1];
        final p3 = points[r + 1][c];
        final p4 = points[r + 1][c + 1];

        // Triangle 1
        final thresh1 = rand.nextDouble();
        if (progress < thresh1) {
          path.moveTo(p1.x, p1.y);
          path.lineTo(p2.x, p2.y);
          path.lineTo(p3.x, p3.y);
          path.close();
        }

        // Triangle 2
        final thresh2 = rand.nextDouble();
        if (progress < thresh2) {
          path.moveTo(p2.x, p2.y);
          path.lineTo(p4.x, p4.y);
          path.lineTo(p3.x, p3.y);
          path.close();
        }
        shardIndex++;
      }
    }

    return path;
  }

  @override
  bool shouldReclip(covariant ShardClipper oldDelegate) {
    return oldDelegate.progress != progress;
  }
}
