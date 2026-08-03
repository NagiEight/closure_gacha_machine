import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';

class BannerDetailsWidget extends StatefulWidget {
  final BannerEntity banner;
  final GachaPort gachaPort;

  const BannerDetailsWidget({
    super.key,
    required this.banner,
    required this.gachaPort,
  });

  @override
  State<BannerDetailsWidget> createState() => _BannerDetailsWidgetState();
}

class _BannerDetailsWidgetState extends State<BannerDetailsWidget> {
  final Map<String, String> _operatorNames = {};
  final Map<String, int> _operatorRarities = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadOperatorInfo();
  }

  Future<void> _loadOperatorInfo() async {
    final featuredSixStars = widget.banner.operatorPool.sixStars.primary;
    final featuredFiveStars = widget.banner.operatorPool.fiveStars.primary;
    final allFeaturedIds = [...featuredSixStars, ...featuredFiveStars];

    final names = <String, String>{};
    final rarities = <String, int>{};

    for (final id in allFeaturedIds) {
      try {
        final operator = await widget.gachaPort.getOperatorDetails(id);
        names[id] = operator.name;
        rarities[id] = operator.rarity;
      } catch (_) {
        names[id] = id;
        rarities[id] = featuredSixStars.contains(id) ? 6 : 5;
      }
    }

    if (mounted) {
      setState(() {
        _operatorNames.addAll(names);
        _operatorRarities.addAll(rarities);
        _isLoading = false;
      });
    }
  }

  Color _getRarityColor(int rarity) {
    switch (rarity) {
      case 6:
        return Colors.amber;
      case 5:
        return Colors.orangeAccent;
      case 4:
        return Colors.purpleAccent;
      default:
        return Colors.blueAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    final imageUrl = widget.gachaPort.getBannerCoverUrl(widget.banner.name);
    final featuredSixStars = widget.banner.operatorPool.sixStars.primary;
    final featuredFiveStars = widget.banner.operatorPool.fiveStars.primary;
    final allFeatured = [...featuredSixStars, ...featuredFiveStars];

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: CachedNetworkImage(imageUrl: imageUrl, fit: BoxFit.cover),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.amber[700]!.withValues(),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.amber[700]!),
            ),
            child: Text(
              widget.banner.type.name.toUpperCase(),
              style: TextStyle(
                color: Colors.amber[400],
                fontSize: 11,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            widget.banner.name,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          if (allFeatured.isNotEmpty) ...[
            Row(
              children: [
                Text(
                  '>> FEATURED ',
                  style: TextStyle(
                    color: Colors.cyanAccent[400],
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                    letterSpacing: 1.1,
                  ),
                ),
                const Expanded(
                  child: Divider(color: Colors.white12, thickness: 1),
                ),
              ],
            ),
            const SizedBox(height: 6),
            _isLoading
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8.0),
                    child: SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.amber,
                      ),
                    ),
                  )
                : Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: allFeatured.map((id) {
                      final rarity = _operatorRarities[id] ?? 5;
                      final rarityColor = _getRarityColor(rarity);

                      return Chip(
                        backgroundColor: const Color(0xFF2C2C2C),
                        side: BorderSide(
                          color: rarityColor.withValues(),
                          width: 1,
                        ),
                        label: Text(
                          _operatorNames[id] ?? id,
                          style: TextStyle(
                            color: rarityColor,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
          ],
        ],
      ),
    );
  }
}
