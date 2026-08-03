// presentation/widgets/analytics/rarity_timeline_chart.dart

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:ui/domain/entities/local_entities.dart';

class RarityTimelineChart extends StatelessWidget {
  final List<HistoryEntry> history;
  final Map<String, int> operatorRarities;

  const RarityTimelineChart({
    super.key,
    required this.history,
    required this.operatorRarities,
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
        return Colors.lightBlueAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty) {
      return const SizedBox(
        height: 180,
        child: Center(
          child: Text(
            'No pull history available.',
            style: TextStyle(color: Colors.white38, fontFamily: 'monospace'),
          ),
        ),
      );
    }

    // Sort chronologically (1st pull -> Nth pull)
    final sortedHistory = List<HistoryEntry>.from(history)
      ..sort((a, b) => a.timestamp.compareTo(b.timestamp));

    final totalPulls = sortedHistory.length;
    final spots = <FlSpot>[];

    for (int i = 0; i < totalPulls; i++) {
      final entry = sortedHistory[i];
      final rarity = operatorRarities[entry.operatorId] ?? 3;
      spots.add(FlSpot((i + 1).toDouble(), rarity.toDouble()));
    }

    // Allocate 28px of width per pull so points remain spacious and easy to tap
    const double pxPerPull = 28.0;
    final double calculatedWidth = totalPulls * pxPerPull;

    return SizedBox(
      height: 220,
      child: Row(
        children: [
          // Fixed Y-Axis Labels
          SizedBox(
            width: 32,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                for (int rarity = 6; rarity >= 3; rarity--)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      '$rarity★',
                      style: TextStyle(
                        color: _getRarityColor(rarity),
                        fontFamily: 'monospace',
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ),
                const SizedBox(
                  height: 20,
                ), // Bottom margin offset for X-axis labels
              ],
            ),
          ),

          // Scrollable Chart Content
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              reverse: true, // Start scrolled to the newest pulls on the right
              child: SizedBox(
                width: calculatedWidth < 300.0 ? 300.0 : calculatedWidth,
                child: LineChart(
                  LineChartData(
                    gridData: FlGridData(
                      show: true,
                      drawVerticalLine: true,
                      horizontalInterval: 1,
                      verticalInterval:
                          5, // Show a vertical grid line every 5 pulls
                      getDrawingHorizontalLine: (_) =>
                          const FlLine(color: Colors.white10, strokeWidth: 1),
                      getDrawingVerticalLine: (_) =>
                          const FlLine(color: Colors.white10, strokeWidth: 1),
                    ),
                    titlesData: FlTitlesData(
                      topTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false),
                      ),
                      rightTitles: const AxisTitles(
                        sideTitles: SideTitles(showTitles: false),
                      ),
                      leftTitles: const AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: false,
                        ), // Rendered in fixed Y axis above
                      ),
                      bottomTitles: AxisTitles(
                        sideTitles: SideTitles(
                          showTitles: true,
                          interval: 5,
                          getTitlesWidget: (value, meta) {
                            final pullNum = value.toInt();
                            if (pullNum < 1 || pullNum > totalPulls) {
                              return const SizedBox.shrink();
                            }
                            return Text(
                              '#$pullNum',
                              style: const TextStyle(
                                color: Colors.white38,
                                fontFamily: 'monospace',
                                fontSize: 9,
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                    borderData: FlBorderData(
                      show: true,
                      border: Border.all(color: Colors.white12, width: 1),
                    ),
                    minX: 1,
                    maxX: totalPulls.toDouble(),
                    minY: 2.5,
                    maxY: 6.5,

                    extraLinesData: ExtraLinesData(
                      horizontalLines: [
                        HorizontalLine(
                          y: 6.0,
                          color: Colors.orangeAccent.withValues(alpha: 0.3),
                          strokeWidth: 1,
                          dashArray: [4, 4],
                          label: HorizontalLineLabel(
                            show: true,
                            alignment: Alignment.topRight,
                            style: const TextStyle(
                              color: Colors.orangeAccent,
                              fontSize: 8,
                              fontFamily: 'monospace',
                            ),
                            labelResolver: (_) => '6★ TARGET',
                          ),
                        ),
                      ],
                    ),

                    lineBarsData: [
                      LineChartBarData(
                        spots: spots,
                        isCurved: false,
                        color: Colors.amber.withValues(alpha: 0.25),
                        barWidth: 1.5,
                        dotData: FlDotData(
                          show: true,
                          getDotPainter: (spot, percent, barData, index) {
                            final rarity = spot.y.toInt();
                            final isSixStar = rarity == 6;

                            return FlDotCirclePainter(
                              radius: isSixStar ? 5 : 3,
                              color: _getRarityColor(rarity),
                              strokeWidth: isSixStar ? 2 : 0,
                              strokeColor: isSixStar
                                  ? Colors.white
                                  : Colors.transparent,
                            );
                          },
                        ),
                      ),
                    ],

                    lineTouchData: LineTouchData(
                      touchTooltipData: LineTouchTooltipData(
                        getTooltipColor: (_) => const Color(0xFF1E1E1E),
                        getTooltipItems: (touchedSpots) {
                          return touchedSpots.map((spot) {
                            final pullIndex = spot.x.toInt();
                            final rarity = spot.y.toInt();
                            final entry = sortedHistory[pullIndex - 1];

                            return LineTooltipItem(
                              'Pull #$pullIndex\nOperator: ${entry.operatorId}\nRarity: $rarity★',
                              TextStyle(
                                color: _getRarityColor(rarity),
                                fontFamily: 'monospace',
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            );
                          }).toList();
                        },
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
