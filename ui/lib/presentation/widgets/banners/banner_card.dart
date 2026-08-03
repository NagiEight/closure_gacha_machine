import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:ui/application/use_cases/get_gacha_roll.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/domain/repositories/currency_repository.dart';
import 'package:ui/domain/repositories/gacha_collection_repository.dart';
import 'package:ui/presentation/pages/gacha.dart';

class BannerCard extends StatefulWidget {
  final BannerEntity banner;
  final bool isActive;
  final GachaPort gachaPort;
  final CurrencyRepository currencyRepo;
  final GachaCollectionRepository collectionRepo;
  final GetGachaRoll performGachaRollUseCase;

  const BannerCard({
    super.key,
    required this.banner,
    required this.isActive,
    required this.gachaPort,
    required this.currencyRepo,
    required this.collectionRepo,
    required this.performGachaRollUseCase,
  });

  @override
  State<BannerCard> createState() => _BannerCardState();
}

class _BannerCardState extends State<BannerCard> {
  final Map<String, String> _operatorNames = {};
  bool _isLoadingNames = true;

  @override
  void initState() {
    super.initState();
    _loadFeaturedNames();
  }

  Future<void> _loadFeaturedNames() async {
    final featuredList = [
      ...widget.banner.operatorPool.sixStars.primary,
      ...widget.banner.operatorPool.sixStars.secondary,
    ];

    final names = <String, String>{};
    for (final id in featuredList) {
      try {
        final op = await widget.gachaPort.getOperatorDetails(id);
        names[id] = op.name;
      } catch (_) {
        names[id] = id;
      }
    }

    if (mounted) {
      setState(() {
        _operatorNames.addAll(names);
        _isLoadingNames = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeColor = Colors.amber[600]!;
    final imageUrl = widget.gachaPort.getBannerCoverUrl(widget.banner.name);

    final featuredList = [
      ...widget.banner.operatorPool.sixStars.primary,
      ...widget.banner.operatorPool.sixStars.secondary,
    ];

    final displayFeaturedText = featuredList
        .map((id) => _operatorNames[id] ?? id)
        .join(', ');

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: widget.isActive ? activeColor : Colors.grey[850]!,
          width: widget.isActive ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 7,
            child: CachedNetworkImage(imageUrl: imageUrl, fit: BoxFit.cover),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: widget.isActive
                            ? activeColor.withValues(alpha: 0.2)
                            : Colors.grey[800],
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        widget.isActive
                            ? 'ACTIVE'
                            : 'Released: ${widget.banner.releaseDate.toIso8601String().split('T').first}',
                        style: TextStyle(
                          color: widget.isActive
                              ? activeColor
                              : Colors.grey[400],
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Text(
                      widget.banner.type.name.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  widget.banner.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (featuredList.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  _isLoadingNames
                      ? Text(
                          'Featured: Loading...',
                          style: TextStyle(
                            color: Colors.grey[500],
                            fontSize: 13,
                            fontStyle: FontStyle.italic,
                          ),
                        )
                      : Text(
                          'Featured: $displayFeaturedText',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 13,
                          ),
                        ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: widget.isActive
                          ? activeColor
                          : Colors.grey[800],
                      foregroundColor: widget.isActive
                          ? Colors.black
                          : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: () async {
                      try {
                        final session = await widget.gachaPort.createSession();

                        if (!context.mounted) return;

                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => GachaPage(
                              banner: widget.banner,
                              gachaPort: widget.gachaPort,
                              sessionToken: session.token,
                              currencyRepo: widget.currencyRepo,
                              collectionRepo: widget.collectionRepo,
                              performGachaRollUseCase:
                                  widget.performGachaRollUseCase,
                            ),
                          ),
                        );
                      } catch (e) {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Failed to start session: $e'),
                            backgroundColor: Colors.redAccent,
                          ),
                        );
                      }
                    },
                    child: Text(
                      widget.isActive ? 'Simulate Banner' : 'Preview Pool',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
