import 'package:ui/domain/entities/local_entities.dart';

abstract class CurrencyRepository {
  Future<Currency> getCurrency();
  Future<void> saveCurrency(Currency currency);
}
