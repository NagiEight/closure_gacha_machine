import 'package:flutter_test/flutter_test.dart';
import 'package:ui/domain/entities/api_entities.dart';

void main() {
  group('parseTimestamp', () {
    test('returns 0 for null or empty values', () {
      expect(parseTimestamp(null), equals(0));
      expect(parseTimestamp(''), equals(0));
      expect(parseTimestamp('invalid'), equals(0));
    });

    test('parses integer milliseconds and seconds accurately', () {
      expect(parseTimestamp(1600000000000), equals(1600000000000));
      // Converts seconds (< 100000000000) to milliseconds (* 1000)
      expect(parseTimestamp(1600000000), equals(1600000000000));
    });

    test('parses ISO date strings', () {
      final dateStr = '2025-01-01T00:00:00.000Z';
      final expectedMs = DateTime.parse(dateStr).millisecondsSinceEpoch;
      expect(parseTimestamp(dateStr), equals(expectedMs));
    });
  });

  group('BannerType', () {
    test('fromInt converts integer to BannerType correctly', () {
      expect(BannerType.fromInt(0), equals(BannerType.standard));
      expect(BannerType.fromInt(1), equals(BannerType.limited));
      expect(BannerType.fromInt(2), equals(BannerType.orienteering));
      expect(BannerType.fromInt(3), equals(BannerType.jointOperation));
      expect(BannerType.fromInt(4), equals(BannerType.tftw));
      expect(BannerType.fromInt(999), equals(BannerType.standard)); // Fallback
    });
  });

  group('SixStarsPool', () {
    test('fromJson and toJson produce matching data', () {
      final json = {
        'primary': ['char_001'],
        'secondary': ['char_002'],
        'standard': ['char_003'],
      };

      final pool = SixStarsPool.fromJson(json);
      expect(pool.primary, contains('char_001'));
      expect(pool.secondary, contains('char_002'));
      expect(pool.standard, contains('char_003'));
      expect(pool.toJson(), equals(json));
    });
  });

  group('BannerEntity', () {
    test('fromJson correctly parses banner data', () {
      final json = {
        'Name': 'EN Limited Banner',
        'ReleaseDate': 1600000000000,
        'Type': 1,
        'OperatorPool': {
          'SixStarsPool': {
            'Primary': ['char_101_chen2'],
            'Secondary': [],
            'Standard': ['char_102_silverash'],
          },
          'FiveStarsPool': {
            'Primary': ['char_201_flyan'],
            'Standard': [],
          },
          'FourStarsPool': {
            'Primary': [],
            'Standard': ['char_301_myrtle'],
          },
          'ThreeStarsPool': ['char_401_kroos'],
        },
      };

      final banner = BannerEntity.fromJson(json);
      expect(banner.name, equals('EN Limited Banner'));
      expect(banner.type, equals(BannerType.limited));
      expect(banner.operatorPool.sixStars.primary, contains('char_101_chen2'));
      expect(banner.operatorPool.threeStars, contains('char_401_kroos'));
    });
  });

  group('Operator', () {
    test('fromJson parses operator entity correctly', () {
      final json = {
        'ID': 'char_101_chen2',
        'Name': 'Ch\'en the Holungday',
        'Rarity': 6,
        'ReleaseDate': 1600000000000,
        'Limited': true,
      };

      final op = Operator.fromJson(json);
      expect(op.id, equals('char_101_chen2'));
      expect(op.name, equals('Ch\'en the Holungday'));
      expect(op.rarity, equals(6));
      expect(op.isLimited, isTrue);
    });
  });
}
