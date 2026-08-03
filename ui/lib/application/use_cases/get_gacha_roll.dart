// application/use_cases/get_gacha_roll.dart

import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/domain/repositories/currency_repository.dart';
import 'package:ui/domain/repositories/gacha_collection_repository.dart';

enum RollCurrencyType { permitTen, permitOne, originite, orundum }

class GetGachaRoll {
  final CurrencyRepository _currencyRepo;
  final GachaCollectionRepository _collectionRepo;
  final GachaPort _gachaPort;

  const GetGachaRoll(this._currencyRepo, this._collectionRepo, this._gachaPort);

  Future<List<String>> execute({
    required String bannerName,
    required String sessionToken,
    required RollCurrencyType currencyType,
    required int count,
  }) async {
    final currentCurrency = await _currencyRepo.getCurrency();

    // 1. Calculate required cost based on currency selection
    final updatedCurrency = _deductCost(currentCurrency, currencyType, count);

    // 2. Perform roll API call
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

    // 3. Persist deducted currency
    await _currencyRepo.saveCurrency(updatedCurrency);

    // 4. Update collection with history and acquired ops
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

    // Explicit non-null return!
    return results;
  }

  Currency _deductCost(
    Currency currency,
    RollCurrencyType currencyType,
    int count,
  ) {
    return switch (currencyType) {
      RollCurrencyType.permitTen => () {
        final requiredPermits = (count / 10).ceil();
        if (currency.permitTen < requiredPermits) {
          throw Exception('Insufficient 10-Headhunt Permits');
        }
        return currency.copyWith(
          permitTen: currency.permitTen - requiredPermits,
        );
      }(),
      RollCurrencyType.permitOne => () {
        if (currency.permitOne < count) {
          throw Exception('Insufficient Headhunt Permits');
        }
        return currency.copyWith(permitOne: currency.permitOne - count);
      }(),
      RollCurrencyType.orundum => () {
        final requiredOrundum = count * 600;
        if (currency.orundum < requiredOrundum) {
          throw Exception('Insufficient Orundum');
        }
        return currency.copyWith(orundum: currency.orundum - requiredOrundum);
      }(),
      RollCurrencyType.originite => () {
        final requiredOriginite = ((count * 600) / 180).ceil();
        if (currency.originite < requiredOriginite) {
          throw Exception('Insufficient Originite Prime');
        }
        return currency.copyWith(
          originite: currency.originite - requiredOriginite,
        );
      }(),
    };
  }
}
