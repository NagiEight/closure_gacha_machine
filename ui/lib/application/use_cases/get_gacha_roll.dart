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

    // 4. Update collection with new operators and roll stats
    final currentCollection = await _collectionRepo.getCollection();
    final updatedOperators = [
      ...currentCollection.acquiredOperatorIds,
      ...results,
    ];

    final updatedCollection = currentCollection.copyWith(
      acquiredOperatorIds: updatedOperators,
      totalRolls: currentCollection.totalRolls + count,
    );

    await _collectionRepo.saveCollection(updatedCollection);

    return results;
  }

  Currency _deductCost(
    Currency currency,
    RollCurrencyType currencyType,
    int count,
  ) {
    switch (currencyType) {
      case RollCurrencyType.permitTen:
        // Requires 1 Permit x10 per 10 rolls
        final requiredPermits = (count / 10).ceil();
        if (currency.permitTen < requiredPermits) {
          throw Exception('Insufficient 10-Headhunt Permits');
        }
        return currency.copyWith(
          permitTen: currency.permitTen - requiredPermits,
        );

      case RollCurrencyType.permitOne:
        if (currency.permitOne < count) {
          throw Exception('Insufficient Headhunt Permits');
        }
        return currency.copyWith(permitOne: currency.permitOne - count);

      case RollCurrencyType.orundum:
        // Arknights standard: 600 Orundum per roll
        final requiredOrundum = count * 600;
        if (currency.orundum < requiredOrundum) {
          throw Exception('Insufficient Orundum');
        }
        return currency.copyWith(orundum: currency.orundum - requiredOrundum);

      case RollCurrencyType.originite:
        // Arknights standard: 1 Originite Prime = 180 Orundum
        final requiredOriginite = ((count * 600) / 180).ceil();
        if (currency.originite < requiredOriginite) {
          throw Exception('Insufficient Originite Prime');
        }
        return currency.copyWith(
          originite: currency.originite - requiredOriginite,
        );
    }
  }
}
