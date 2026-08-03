import 'package:flutter/foundation.dart';

import '../../domain/entities/api_entities.dart';
import '../../domain/ports/gacha_port.dart';

/// Pure Use Case to retrieve, parse, and filter paginated banners
class GetBanners {
  final GachaPort _gachaPort;

  const GetBanners(this._gachaPort);

  Future<List<BannerEntity>> execute({
    required int page,
    String? regionPrefix,
  }) async {
    // 1. Fetch paginated banner names from domain port
    final bannerNames = await _gachaPort.getBannersPage(page);

    if (bannerNames.isEmpty) {
      return const [];
    }

    // 2. Filter by server region prefix if specified (e.g. "EN", "CN", "JP")
    final prefix = regionPrefix?.toUpperCase().trim();
    final filteredNames = (prefix == null || prefix.isEmpty)
        ? bannerNames
        : bannerNames.where((name) {
            final upperName = name.toUpperCase();
            // Match "EN " or exact prefix start
            return upperName.startsWith('$prefix ') ||
                upperName.startsWith(prefix);
          }).toList();

    if (filteredNames.isEmpty) {
      return const [];
    }

    // 3. Fetch detailed metadata concurrently
    final banners = await Future.wait(
      filteredNames.map((name) async {
        try {
          return await _gachaPort.getBannerDetails(name);
        } catch (e) {
          if (kDebugMode) {
            print(
              '[DEBUG GetBanners] Failed to fetch details for banner "$name": $e',
            );
          }
          rethrow;
        }
      }),
    );

    return banners;
  }
}
