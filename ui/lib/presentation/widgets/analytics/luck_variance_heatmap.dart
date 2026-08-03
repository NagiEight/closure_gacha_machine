// presentation/widgets/analytics/luck_variance_heatmap.dart

import 'package:flutter/material.dart';

class LuckVarianceHeatmap extends StatelessWidget {
  /// Maps a banner name or time period to its standard deviation (-3.0 to 3.0)
  final Map<String, double> bannerVariances;

  const LuckVarianceHeatmap({super.key, required this.bannerVariances});

  Color _getHeatmapColor(double variance) {
    if (variance >= 0) {
      // Red for extreme luck
      return Color.lerp(
        Colors.grey[850],
        Colors.redAccent,
        (variance / 3.0).clamp(0.0, 1.0),
      )!;
    }
    // Deep purple for statistical despair
    return Color.lerp(
      Colors.grey[850],
      const Color(0xFF1A0033),
      (-variance / 3.0).clamp(0.0, 1.0),
    )!;
  }

  @override
  Widget build(BuildContext context) {
    if (bannerVariances.isEmpty) {
      return const Center(
        child: Text(
          'No gacha history to analyze.',
          style: TextStyle(color: Colors.white38, fontFamily: 'monospace'),
        ),
      );
    }

    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: bannerVariances.entries.map((entry) {
        final v = entry.value;
        return Tooltip(
          message:
              '${entry.key}\nVariance: ${v > 0 ? '+' : ''}${v.toStringAsFixed(2)}σ',
          textStyle: const TextStyle(
            fontFamily: 'monospace',
            fontSize: 12,
            color: Colors.white,
          ),
          decoration: BoxDecoration(
            color: Colors.black87,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: _getHeatmapColor(v),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.white24, width: 0.5),
            ),
          ),
        );
      }).toList(),
    );
  }
}
