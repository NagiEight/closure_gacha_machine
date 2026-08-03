import 'package:flutter/material.dart';
import 'package:ui/application/use_cases/get_gacha_roll.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/domain/repositories/currency_repository.dart';
import 'package:ui/domain/repositories/gacha_collection_repository.dart';
import 'package:ui/presentation/pages/gacha.dart';

class BannerCard extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final activeColor = Colors.amber[600]!;
    final imageUrl = gachaPort.getBannerCoverUrl(banner.name);

    final featuredList = [
      ...banner.operatorPool.sixStars.primary,
      ...banner.operatorPool.sixStars.secondary,
    ];

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive ? activeColor : Colors.grey[850]!,
          width: isActive ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 7,
            child: Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                color: Colors.grey[900],
                child: const Center(
                  child: Icon(Icons.broken_image, color: Colors.white38),
                ),
              ),
            ),
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
                        color: isActive
                            ? activeColor.withValues(alpha: 0.2)
                            : Colors.grey[800],
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isActive
                            ? 'ACTIVE'
                            : 'Released: ${banner.releaseDate.toIso8601String().split('T').first}',
                        style: TextStyle(
                          color: isActive ? activeColor : Colors.grey[400],
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Text(
                      banner.type.name.toUpperCase(),
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
                  banner.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (featuredList.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Featured: ${featuredList.join(", ")}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.grey[400], fontSize: 13),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isActive
                          ? activeColor
                          : Colors.grey[800],
                      foregroundColor: isActive ? Colors.black : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: () async {
                      try {
                        final session = await gachaPort.createSession();

                        if (!context.mounted) return;

                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => GachaPage(
                              banner: banner,
                              gachaPort: gachaPort,
                              sessionToken: session.token,
                              currencyRepo: currencyRepo,
                              collectionRepo: collectionRepo,
                              performGachaRollUseCase: performGachaRollUseCase,
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
                      isActive ? 'Simulate Banner' : 'Preview Pool',
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
