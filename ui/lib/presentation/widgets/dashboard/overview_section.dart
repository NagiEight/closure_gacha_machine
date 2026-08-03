import 'package:flutter/material.dart';
import 'package:ui/presentation/widgets/analytics/analytics_card.dart';
import 'package:ui/presentation/widgets/dashboard/stat_display.dart';

class OverviewSection extends StatelessWidget {
  final int totalPulls;
  final int uniqueOps;

  const OverviewSection({
    super.key,
    required this.totalPulls,
    required this.uniqueOps,
  });

  @override
  Widget build(BuildContext context) {
    return AnalyticsCard(
      title: 'HEADHUNT OVERVIEW',
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          StatDisplay(label: 'TOTAL PULLS', value: '$totalPulls'),
          Container(height: 36, width: 1, color: Colors.white12),
          StatDisplay(label: 'UNIQUE OPS', value: '$uniqueOps'),
          Container(height: 36, width: 1, color: Colors.white12),
          StatDisplay(
            label: 'COLLECTION RATE',
            value: totalPulls > 0
                ? '${((uniqueOps / totalPulls) * 100).toStringAsFixed(1)}%'
                : '0%',
          ),
        ],
      ),
    );
  }
}
