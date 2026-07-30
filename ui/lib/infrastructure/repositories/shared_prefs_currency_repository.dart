import 'package:shared_preferences/shared_preferences.dart';
import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/repositories/currency_repository.dart';

class SharedPrefsCurrencyAdapter implements CurrencyRepository {
  static const _kPermitTen = 'currency_permit_ten';
  static const _kPermitOne = 'currency_permit_one';
  static const _kOriginite = 'currency_originite';
  static const _kOrundum = 'currency_orundum';

  @override
  Future<Currency> getCurrency() async {
    final prefs = await SharedPreferences.getInstance();
    return Currency(
      permitTen: prefs.getInt(_kPermitTen) ?? 0,
      permitOne: prefs.getInt(_kPermitOne) ?? 0,
      originite: prefs.getInt(_kOriginite) ?? 0,
      orundum: prefs.getInt(_kOrundum) ?? 0,
    );
  }

  @override
  Future<void> saveCurrency(Currency currency) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_kPermitTen, currency.permitTen);
    await prefs.setInt(_kPermitOne, currency.permitOne);
    await prefs.setInt(_kOriginite, currency.originite);
    await prefs.setInt(_kOrundum, currency.orundum);
  }
}
