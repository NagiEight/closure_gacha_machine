import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:ui/application/use_cases/get_banners.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';

class MockGachaPort extends Mock implements GachaPort {}

void main() {
  late MockGachaPort mockGachaPort;
  late GetBanners getBanners;

  final dummyBanner1 = BannerEntity(
    name: 'EN SilverAsh Banner',
    releaseDate: DateTime.utc(2025, 1, 1),
    type: BannerType.standard,
    operatorPool: const OperatorPool(
      sixStars: SixStarsPool(primary: ['silverash'], secondary: [], standard: []),
      fiveStars: TieredOperatorPool(primary: [], standard: []),
      fourStars: TieredOperatorPool(primary: [], standard: []),
      threeStars: [],
    ),
  );

  final dummyBanner2 = BannerEntity(
    name: 'CN Surtr Banner',
    releaseDate: DateTime.utc(2025, 2, 1),
    type: BannerType.standard,
    operatorPool: const OperatorPool(
      sixStars: SixStarsPool(primary: ['surtr'], secondary: [], standard: []),
      fiveStars: TieredOperatorPool(primary: [], standard: []),
      fourStars: TieredOperatorPool(primary: [], standard: []),
      threeStars: [],
    ),
  );

  setUp(() {
    mockGachaPort = MockGachaPort();
    getBanners = GetBanners(mockGachaPort);
  });

  test('returns empty list when page has no banners', () async {
    when(() => mockGachaPort.getBannersPage(1)).thenAnswer((_) async => []);

    final result = await getBanners.execute(page: 1);

    expect(result, isEmpty);
    verify(() => mockGachaPort.getBannersPage(1)).called(1);
    verifyNever(() => mockGachaPort.getBannerDetails(any()));
  });

  test('fetches all banners when regionPrefix is null', () async {
    when(() => mockGachaPort.getBannersPage(1))
        .thenAnswer((_) async => ['EN SilverAsh Banner', 'CN Surtr Banner']);
    when(() => mockGachaPort.getBannerDetails('EN SilverAsh Banner'))
        .thenAnswer((_) async => dummyBanner1);
    when(() => mockGachaPort.getBannerDetails('CN Surtr Banner'))
        .thenAnswer((_) async => dummyBanner2);

    final result = await getBanners.execute(page: 1);

    expect(result.length, equals(2));
    expect(result, contains(dummyBanner1));
    expect(result, contains(dummyBanner2));
  });

  test('filters banners by regionPrefix correctly', () async {
    when(() => mockGachaPort.getBannersPage(1))
        .thenAnswer((_) async => ['EN SilverAsh Banner', 'CN Surtr Banner']);
    when(() => mockGachaPort.getBannerDetails('EN SilverAsh Banner'))
        .thenAnswer((_) async => dummyBanner1);

    final result = await getBanners.execute(page: 1, regionPrefix: 'EN');

    expect(result.length, equals(1));
    expect(result.first.name, equals('EN SilverAsh Banner'));
    verify(() => mockGachaPort.getBannerDetails('EN SilverAsh Banner')).called(1);
    verifyNever(() => mockGachaPort.getBannerDetails('CN Surtr Banner'));
  });

  test('rethrows exception when fetching banner details fails', () async {
    when(() => mockGachaPort.getBannersPage(1))
        .thenAnswer((_) async => ['EN SilverAsh Banner']);
    when(() => mockGachaPort.getBannerDetails('EN SilverAsh Banner'))
        .thenThrow(Exception('Network error'));

    expect(
      () => getBanners.execute(page: 1),
      throwsA(isA<Exception>()),
    );
  });
}
