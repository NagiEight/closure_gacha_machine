// presentation/widgets/history/unique_operator_tile.dart

import 'package:flutter/material.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/presentation/pages/history.dart';

class UniqueOperatorTile extends StatelessWidget {
  final UniqueOperatorSummary summary;
  final GachaPort gachaPort;

  const UniqueOperatorTile({
    super.key,
    required this.summary,
    required this.gachaPort,
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

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Operator?>(
      future: gachaPort.getOperatorDetails(summary.operatorId),
      builder: (context, snapshot) {
        final op = snapshot.data;
        final rarity = op?.rarity ?? 3;
        final name = op?.name ?? summary.operatorId;
        final accentColor = _getRarityColor(rarity);

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF1E1E1E),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.white10),
          ),
          child: Row(
            children: [
              Container(
                width: 4,
                height: 48,
                decoration: BoxDecoration(
                  color: accentColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'x${summary.count}',
                          style: TextStyle(
                            color: accentColor,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'monospace',
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'First: ${_formatDate(summary.firstPulled)}',
                      style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 10,
                        fontFamily: 'monospace',
                      ),
                    ),
                    Text(
                      'Last:  ${_formatDate(summary.lastPulled)}',
                      style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 10,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '$rarity★',
                style: TextStyle(
                  color: accentColor,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                  fontSize: 16,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
