// presentation/widgets/history/history_item_tile.dart

import 'package:flutter/material.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';

class HistoryItemTile extends StatelessWidget {
  final HistoryEntry entry;
  final GachaPort gachaPort;

  const HistoryItemTile({
    super.key,
    required this.entry,
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

  String _formatDate(DateTime dt) {
    String pad(int n) => n.toString().padLeft(2, '0');
    return '${dt.year}-${pad(dt.month)}-${pad(dt.day)} ${pad(dt.hour)}:${pad(dt.minute)}';
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Operator?>(
      future: gachaPort.getOperatorDetails(entry.operatorId),
      builder: (context, snapshot) {
        final op = snapshot.data;
        final name = op?.name ?? entry.operatorId;
        final rarity = op?.rarity ?? 3;
        final accentColor = _getRarityColor(rarity);

        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFF181818),
            borderRadius: BorderRadius.circular(6),
            border: Border(left: BorderSide(color: accentColor, width: 4)),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: SizedBox(
                  width: 56,
                  height: 56,
                  child: Image.network(
                    gachaPort.getOperatorCardUrl(entry.operatorId),
                    fit: BoxFit.cover,
                    alignment: const Alignment(0.0, -0.6),
                    errorBuilder: (_, _, _) => Container(
                      color: Colors.grey[900],
                      child: const Icon(
                        Icons.person_rounded,
                        color: Colors.white38,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        if (entry.bannerName.isNotEmpty)
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 4,
                                vertical: 1,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white10,
                                borderRadius: BorderRadius.circular(3),
                              ),
                              child: Text(
                                entry.bannerName.toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.amberAccent,
                                  fontSize: 9,
                                  fontFamily: 'monospace',
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatDate(entry.timestamp),
                      style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 11,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                ),
              ),
              if (entry.isNew)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.amber,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'NEW',
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
