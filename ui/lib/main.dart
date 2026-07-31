import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ui/application/use_cases/get_banners.dart';
import 'package:ui/application/use_cases/get_gacha_roll.dart';
import 'package:ui/infrastructure/adapters/closure_gacha_machine.dart';
import 'package:ui/infrastructure/repositories/shared_prefs_currency_repository.dart';
import 'package:ui/infrastructure/repositories/shared_prefs_gacha_collection_adapter.dart';
import 'package:ui/infrastructure/repositories/shared_prefs_sanity_timer_adapter.dart';
import 'package:ui/presentation/pages/banners.dart';
import 'package:ui/presentation/pages/timer.dart';
import 'package:ui/presentation/widgets/main_nav_bar.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  // 1. Initialize Infrastructure Adapters
  final gachaAdapter = ClosureGachaMachineAdapter(
    baseUrl: 'http://localhost:3000',
  );
  final currencyAdapter = SharedPrefsCurrencyAdapter();
  final collectionAdapter = SharedPrefsGachaCollectionAdapter();
  final timerAdapter = SharedPreferencesSanityTimerRepository(prefs);

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
  final SharedPreferencesSanityTimerRepository timerAdapter;
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
      home: MainShellPage(
        gachaAdapter: gachaAdapter,
        currencyAdapter: currencyAdapter,
        timerAdapter: timerAdapter, // Pass it here!
        getBannersUseCase: getBannersUseCase,
        getGachaRollUseCase: getGachaRollUseCase,
      ),
    );
  }
}

class MainShellPage extends StatefulWidget {
  final ClosureGachaMachineAdapter gachaAdapter;
  final SharedPrefsCurrencyAdapter currencyAdapter;
  final SharedPreferencesSanityTimerRepository timerAdapter; // Add here!
  final GetBanners getBannersUseCase;
  final GetGachaRoll getGachaRollUseCase;

  const MainShellPage({
    super.key,
    required this.gachaAdapter,
    required this.currencyAdapter,
    required this.timerAdapter,
    required this.getBannersUseCase,
    required this.getGachaRollUseCase,
  });

  @override
  State<MainShellPage> createState() => _MainShellPageState();
}

class _MainShellPageState extends State<MainShellPage> {
  int _currentIndex = 2;

  @override
  Widget build(BuildContext context) {
    final pages = [
      SanityTimerPage(
        timerRepository: widget.timerAdapter,
      ), // Now you can instantiate it properly!
      const Center(
        child: Text(
          'History Placeholder',
          style: TextStyle(color: Colors.white54),
        ),
      ),
      BannersPage(
        getBannersUseCase: widget.getBannersUseCase,
        gachaPort: widget.gachaAdapter,
        currencyRepo: widget.currencyAdapter,
        performGachaRollUseCase: widget.getGachaRollUseCase,
      ),
      const Center(
        child: Text(
          'Inventory Placeholder',
          style: TextStyle(color: Colors.white54),
        ),
      ),
      const Center(
        child: Text(
          'Settings Placeholder',
          style: TextStyle(color: Colors.white54),
        ),
      ),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: pages),
      bottomNavigationBar: MainNavBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
      ),
    );
  }
}
