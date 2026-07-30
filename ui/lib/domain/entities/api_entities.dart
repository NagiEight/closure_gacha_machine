import 'package:flutter/foundation.dart';

/// Supported Banner Types matching API enum values
enum BannerType {
  standard(0),
  limited(1),
  orienteering(2),
  jointOperation(3),
  tftw(4);

  final int value;
  const BannerType(this.value);

  factory BannerType.fromInt(int value) {
    return BannerType.values.firstWhere(
      (e) => e.value == value,
      orElse: () => BannerType.standard,
    );
  }
}

int parseTimestamp(dynamic value) {
  if (value == null) {
    return 0;
  }

  int? ms;

  if (value is int) {
    ms = value;
  } else if (value is num) {
    ms = value.toInt();
  } else if (value is String) {
    if (value.contains('-')) {
      final parsed = DateTime.tryParse(value)?.millisecondsSinceEpoch ?? 0;
      return parsed;
    }
    ms = int.tryParse(value);
  }

  if (ms == null || ms == 0) {
    return 0;
  }

  final finalMs = ms < 100000000000 ? ms * 1000 : ms;

  return finalMs;
}

/// Pool of 6-Star operators divided into rate-up tiers and standard pool
@immutable
class SixStarsPool {
  final List<String> primary;
  final List<String> secondary;
  final List<String> standard;

  const SixStarsPool({
    required this.primary,
    required this.secondary,
    required this.standard,
  });

  factory SixStarsPool.fromJson(Map<String, dynamic> json) {
    return SixStarsPool(
      primary: List<String>.from(json['Primary'] ?? []),
      secondary: List<String>.from(json['Secondary'] ?? []),
      standard: List<String>.from(json['Standard'] ?? []),
    );
  }
}

/// Pool of 5-Star / 4-Star operators
@immutable
class TieredOperatorPool {
  final List<String> primary;
  final List<String> standard;

  const TieredOperatorPool({required this.primary, required this.standard});

  factory TieredOperatorPool.fromJson(Map<String, dynamic> json) {
    return TieredOperatorPool(
      primary: List<String>.from(json['Primary'] ?? []),
      standard: List<String>.from(json['Standard'] ?? []),
    );
  }
}

/// Complete Operator Pool structure per Banner
@immutable
class OperatorPool {
  final SixStarsPool sixStars;
  final TieredOperatorPool fiveStars;
  final TieredOperatorPool fourStars;
  final List<String> threeStars;

  const OperatorPool({
    required this.sixStars,
    required this.fiveStars,
    required this.fourStars,
    required this.threeStars,
  });

  factory OperatorPool.fromJson(Map<String, dynamic> json) {
    return OperatorPool(
      sixStars: SixStarsPool.fromJson(json['SixStarsPool'] ?? {}),
      fiveStars: TieredOperatorPool.fromJson(json['FiveStarsPool'] ?? {}),
      fourStars: TieredOperatorPool.fromJson(json['FourStarsPool'] ?? {}),
      threeStars: List<String>.from(json['ThreeStarsPool'] ?? []),
    );
  }
}

/// Banner Entity
@immutable
class BannerEntity {
  final String name;
  final DateTime releaseDate;
  final BannerType type;
  final OperatorPool operatorPool;

  const BannerEntity({
    required this.name,
    required this.releaseDate,
    required this.type,
    required this.operatorPool,
  });

  factory BannerEntity.fromJson(Map<String, dynamic> json) {
    // Check root level first, then fall back to inside OperatorPool
    final operatorPoolJson =
        json['OperatorPool'] as Map<String, dynamic>? ??
        json['operatorPool'] as Map<String, dynamic>? ??
        {};

    final rawDate =
        json['ReleaseDate'] ??
        json['releaseDate'] ??
        json['release_date'] ??
        operatorPoolJson['ReleaseDate'] ??
        operatorPoolJson['releaseDate'];

    final rawType =
        json['Type'] ??
        json['type'] ??
        operatorPoolJson['Type'] ??
        operatorPoolJson['type'] ??
        0;

    return BannerEntity(
      name:
          json['Name'] as String? ??
          json['name'] as String? ??
          'Unknown Banner',
      releaseDate: DateTime.fromMillisecondsSinceEpoch(
        parseTimestamp(rawDate),
        isUtc: true,
      ),
      type: BannerType.fromInt(rawType as int),
      operatorPool: OperatorPool.fromJson(operatorPoolJson),
    );
  }
}

/// Operator Entity
@immutable
class OperatorEntity {
  final String id;
  final String name;
  final int rarity;
  final DateTime releaseDate;
  final bool isLimited;

  const OperatorEntity({
    required this.id,
    required this.name,
    required this.rarity,
    required this.releaseDate,
    required this.isLimited,
  });

  factory OperatorEntity.fromJson(Map<String, dynamic> json) {
    final rawDate =
        json['ReleaseDate'] ?? json['releaseDate'] ?? json['release_date'];

    return OperatorEntity(
      id: json['ID'] as String? ?? json['id'] as String? ?? '',
      name: json['Name'] as String? ?? json['name'] as String? ?? '',
      rarity: (json['Rarity'] as int?) ?? (json['rarity'] as int?) ?? 0,
      releaseDate: DateTime.fromMillisecondsSinceEpoch(
        parseTimestamp(rawDate),
        isUtc: true,
      ),
      isLimited:
          (json['Limited'] as bool?) ?? (json['isLimited'] as bool?) ?? false,
    );
  }
}

/// Gacha Session Profile Entity
@immutable
class GachaSession {
  final String token;

  const GachaSession({required this.token});
}
