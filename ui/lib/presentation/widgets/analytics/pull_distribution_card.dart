import 'package:flutter/material.dart';

class PullDistributionChart extends StatelessWidget {
  final Map<int, int> rarityCounts; // e.g. {6: 2, 5: 8, 4: 15, 3: 25}
  final int totalPulls;

  const PullDistributionChart({
    super.key,
    required this.rarityCounts,
    required this.totalPulls,
  });

  Color _getRarityColor(int rarity) {
    switch (rarity) {
      case 6:
        return Colors.orangeAccent;
      case 5:
        return Colors.amber;
      case 4:
        return Colors.purpleAccent;
      default:
        return Colors.blueAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (totalPulls == 0) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 16),
        child: Center(
          child: Text(
            'NO PULL DATA AVAILABLE',
            style: TextStyle(
              color: Colors.white38,
              fontSize: 11,
              fontFamily: 'monospace',
            ),
          ),
        ),
      );
    }

    // Stacked Horizontal Bar Chart
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: SizedBox(
            height: 16,
            child: Row(
              children: [6, 5, 4, 3].map((rarity) {
                final count = rarityCounts[rarity] ?? 0;
                final flex = (count / totalPulls * 1000).round();
                if (flex == 0) return const SizedBox.shrink();

                return Expanded(
                  flex: flex,
                  child: Container(color: _getRarityColor(rarity)),
                );
              }).toList(),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [6, 5, 4, 3].map((rarity) {
            final count = rarityCounts[rarity] ?? 0;
            final pct = totalPulls > 0
                ? (count / totalPulls * 100).toStringAsFixed(1)
                : '0';

            return Column(
              children: [
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: _getRarityColor(rarity),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '$rarity★',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  '$count ($pct%)',
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 10,
                    fontFamily: 'monospace',
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ],
    );
  }
}
