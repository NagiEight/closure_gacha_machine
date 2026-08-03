import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:ui/presentation/widgets/analytics/analytics_card.dart';
import 'package:ui/presentation/widgets/dashboard/stat_display.dart';

class DespairIndexCard extends StatelessWidget {
  final int currentPityCount;
  final double despairIndex;

  const DespairIndexCard({
    required this.currentPityCount,
    required this.despairIndex,
  });

  @override
  Widget build(BuildContext context) {
    return AnalyticsCard(
      title: 'STATISTICAL DESPAIR INDEX',
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          StatDisplay(
            label: 'CURRENT PITY STREAK',
            value: '$currentPityCount PULLS',
          ),
          Container(height: 36, width: 1, color: Colors.white12),
          StatDisplay(
            label: 'DESPAIR METRIC',
            value: '${despairIndex.toStringAsFixed(1)}%',
          ),
        ],
      ),
    );
  }
}
