// application/use_cases/get_gacha_roll.dart

import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/domain/repositories/gacha_collection_repository.dart';

class GetGachaRoll {
  final GachaCollectionRepository _collectionRepo;
  final GachaPort _gachaPort;

  const GetGachaRoll(this._collectionRepo, this._gachaPort);

  Future<List<String>> execute({
    required String bannerName,
    required String sessionToken,
    required int count,
  }) async {
    if (count <= 0) return [];

    // 1. Perform roll API call directly
    final List<String> results;
    if (count == 1) {
      final singleResult = await _gachaPort.rollSingle(
        bannerName: bannerName,
        sessionToken: sessionToken,
      );
      results = [singleResult];
    } else {
      results = await _gachaPort.rollMultiple(
        bannerName: bannerName,
        sessionToken: sessionToken,
        count: count,
      );
    }

    // 2. Update collection history & acquired ops
    final currentCollection = await _collectionRepo.getCollection();
    final existingIds = currentCollection.acquiredOperatorIds.toSet();
    final now = DateTime.now();

    final newHistoryEntries = <HistoryEntry>[];
    final updatedIds = [...currentCollection.acquiredOperatorIds];

    for (final id in results) {
      final isNew = !existingIds.contains(id);
      newHistoryEntries.add(
        HistoryEntry(
          operatorId: id,
          bannerName: bannerName,
          timestamp: now,
          isNew: isNew,
        ),
      );
      existingIds.add(id);
      updatedIds.add(id);
    }

    final updatedCollection = currentCollection.copyWith(
      acquiredOperatorIds: updatedIds,
      history: [...currentCollection.history, ...newHistoryEntries],
      totalRolls: currentCollection.totalRolls + count,
    );

    await _collectionRepo.saveCollection(updatedCollection);

    return results;
  }
}
