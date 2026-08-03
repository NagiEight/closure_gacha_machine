import 'package:flutter/material.dart';
import 'package:ui/presentation/widgets/analytics/analytics_card.dart';
import 'package:ui/presentation/widgets/dashboard/resource_row.dart';

class InvestmentCard extends StatelessWidget {
  final int totalPulls;

  const InvestmentCard({super.key, required this.totalPulls});

  @override
  Widget build(BuildContext context) {
    final totalSpentOrundum = totalPulls * 600;

    return AnalyticsCard(
      title: 'ESTIMATED INVESTMENT',
      child: Column(
        children: [
          ResourceRow(
            label: 'ORUNDUM EQUIVALENT',
            value: '$totalSpentOrundum',
            icon: Icons.diamond_outlined,
            color: Colors.amber,
          ),
          const SizedBox(height: 12),
          ResourceRow(
            label: 'ORIGINITE PRIME VALUE',
            value: (totalSpentOrundum / 180).toStringAsFixed(1),
            icon: Icons.auto_awesome_rounded,
            color: Colors.deepOrangeAccent,
          ),
        ],
      ),
    );
  }
}
