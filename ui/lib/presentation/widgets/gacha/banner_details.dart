import 'package:flutter/material.dart';
import 'package:ui/domain/entities/api_entities.dart';

class BannerDetails extends StatelessWidget {
  final BannerEntity banner;
  final String imageUrl;

  const BannerDetails({
    super.key,
    required this.banner,
    required this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    final featuredSixStars = banner.operatorPool.sixStars.primary;
    final featuredFiveStars = banner.operatorPool.fiveStars.primary;
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
              child: Image.network(
                imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(
                  color: Colors.grey[900],
                  child: const Center(
                    child: Icon(
                      Icons.broken_image,
                      color: Colors.white38,
                      size: 48,
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.amber[700]!.withOpacity(0.15),
              borderRadius: BorderRadius.circular(4),
              border: Border.all(color: Colors.amber[700]!),
            ),
            child: Text(
              banner.type.name.toUpperCase(),
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
            banner.name,
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
            Text(
              allFeatured.join('  •  '),
              style: TextStyle(
                color: Colors.grey[300],
                fontSize: 14,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
