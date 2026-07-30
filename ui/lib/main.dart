import 'package:flutter/material.dart';
import 'package:ui/application/use_cases/get_banners.dart';
import 'package:ui/application/use_cases/get_gacha_roll.dart';
import 'package:ui/infrastructure/adapters/closure_gacha_machine.dart';
import 'package:ui/presentation/pages/banners.dart';
import 'package:ui/infrastructure/repositories/shared_prefs_currency_repository.dart';
import 'package:ui/infrastructure/repositories/shared_prefs_gacha_collection_adapter.dart';
import 'package:ui/infrastructure/repositories/shared_prefs_sanity_timer_adapter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Initialize Infrastructure Adapters
  final gachaAdapter = ClosureGachaMachineAdapter(
    baseUrl: 'http://localhost:3000',
  );
  final currencyAdapter = SharedPrefsCurrencyAdapter();
  final collectionAdapter = SharedPrefsGachaCollectionAdapter();
  final timerAdapter = SharedPrefsSanityTimerAdapter();

  // 2. Initialize Application Use Cases
  final getBannersUseCase = GetBanners(gachaAdapter);
  final performGachaRollUseCase = GetGachaRoll(
    currencyAdapter,
    collectionAdapter,
    gachaAdapter,
  );

  runApp(
    GachaSimulatorApp(
      gachaAdapter: gachaAdapter,
      currencyAdapter: currencyAdapter,
      collectionAdapter: collectionAdapter,
      timerAdapter: timerAdapter,
      getBannersUseCase: getBannersUseCase,
      getGachaRollUseCase: performGachaRollUseCase,
    ),
  );
}

class GachaSimulatorApp extends StatelessWidget {
  final ClosureGachaMachineAdapter gachaAdapter;
  final SharedPrefsCurrencyAdapter currencyAdapter;
  final SharedPrefsGachaCollectionAdapter collectionAdapter;
  final SharedPrefsSanityTimerAdapter timerAdapter;
  final GetBanners getBannersUseCase;
  final GetGachaRoll getGachaRollUseCase;

  const GachaSimulatorApp({
    super.key,
    required this.gachaAdapter,
    required this.currencyAdapter,
    required this.collectionAdapter,
    required this.timerAdapter,
    required this.getBannersUseCase,
    required this.getGachaRollUseCase,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Arknights Gacha Simulator',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF121212),
        colorScheme: const ColorScheme.dark(
          primary: Colors.amber,
          surface: Color(0xFF1E1E1E),
        ),
      ),
      home: BannersPage(
        getBannersUseCase: getBannersUseCase,
        gachaPort: gachaAdapter,
        currencyRepo: currencyAdapter,
        performGachaRollUseCase: getGachaRollUseCase,
      ),
    );
  }
}
