import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:ui/application/use_cases/get_gacha_roll.dart';
import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/domain/repositories/gacha_collection_repository.dart';

class MockGachaCollectionRepository extends Mock
    implements GachaCollectionRepository {}

class MockGachaPort extends Mock implements GachaPort {}

class FakeGachaCollection extends Fake implements GachaCollection {}

void main() {
  late MockGachaCollectionRepository mockCollectionRepo;
  late MockGachaPort mockGachaPort;
  late GetGachaRoll getGachaRoll;

  setUpAll(() {
    registerFallbackValue(FakeGachaCollection());
  });

  setUp(() {
    mockCollectionRepo = MockGachaCollectionRepository();
    mockGachaPort = MockGachaPort();
    getGachaRoll = GetGachaRoll(mockCollectionRepo, mockGachaPort);
  });

  const emptyCollection = GachaCollection(
    acquiredOperatorIds: [],
    history: [],
    totalRolls: 0,
  );

  test('returns empty list if count <= 0', () async {
    final result = await getGachaRoll.execute(
      bannerName: 'Banner A',
      sessionToken: 'token123',
      count: 0,
    );

    expect(result, isEmpty);
    verifyNever(() => mockGachaPort.rollSingle(
          bannerName: any(named: 'bannerName'),
          sessionToken: any(named: 'sessionToken'),
        ));
  });

  test('executes single roll (count = 1) and updates collection', () async {
    when(() => mockGachaPort.rollSingle(
          bannerName: 'Banner A',
          sessionToken: 'token123',
        )).thenAnswer((_) async => 'char_101_chen2');

    when(() => mockCollectionRepo.getCollection())
        .thenAnswer((_) async => emptyCollection);
    when(() => mockCollectionRepo.saveCollection(any()))
        .thenAnswer((_) async {});

    final results = await getGachaRoll.execute(
      bannerName: 'Banner A',
      sessionToken: 'token123',
      count: 1,
    );

    expect(results, equals(['char_101_chen2']));
    verify(() => mockGachaPort.rollSingle(
          bannerName: 'Banner A',
          sessionToken: 'token123',
        )).called(1);

    final captured = verify(() => mockCollectionRepo.saveCollection(captureAny()))
        .captured
        .single as GachaCollection;

    expect(captured.acquiredOperatorIds, contains('char_101_chen2'));
    expect(captured.totalRolls, equals(1));
    expect(captured.history.length, equals(1));
    expect(captured.history.first.isNew, isTrue);
  });

  test('executes multi roll (count = 10) and handles duplicate operators', () async {
    final rollResults = [
      'char_101_chen2',
      'char_301_myrtle',
      'char_301_myrtle',
    ];

    when(() => mockGachaPort.rollMultiple(
          bannerName: 'Banner B',
          sessionToken: 'token123',
          count: 3,
        )).thenAnswer((_) async => rollResults);

    const existingCollection = GachaCollection(
      acquiredOperatorIds: ['char_101_chen2'],
      history: [],
      totalRolls: 5,
    );

    when(() => mockCollectionRepo.getCollection())
        .thenAnswer((_) async => existingCollection);
    when(() => mockCollectionRepo.saveCollection(any()))
        .thenAnswer((_) async {});

    final results = await getGachaRoll.execute(
      bannerName: 'Banner B',
      sessionToken: 'token123',
      count: 3,
    );

    expect(results, equals(rollResults));

    final captured = verify(() => mockCollectionRepo.saveCollection(captureAny()))
        .captured
        .single as GachaCollection;

    expect(captured.totalRolls, equals(8));
    // char_101_chen2 was already in collection -> isNew is false
    expect(captured.history[0].isNew, isFalse);
    // first char_301_myrtle is new -> isNew is true
    expect(captured.history[1].isNew, isTrue);
    // second char_301_myrtle in same batch is now recognized as existing -> isNew is false
    expect(captured.history[2].isNew, isFalse);
  });
}
