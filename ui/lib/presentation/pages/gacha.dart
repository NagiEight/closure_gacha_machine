import 'package:flutter/material.dart';
import 'package:ui/application/use_cases/get_gacha_roll.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/domain/repositories/currency_repository.dart';
import 'package:ui/presentation/widgets/gacha/banner_details.dart';
import 'package:ui/presentation/widgets/gacha/currency_pill.dart';
import 'package:ui/presentation/widgets/gacha/currency_selector.dart';
import 'package:ui/presentation/widgets/gacha/gacha_action_button.dart';
import 'package:ui/presentation/widgets/gacha/gacha_modals.dart';

class GachaPage extends StatefulWidget {
  final BannerEntity banner;
  final GachaPort gachaPort;
  final String sessionToken;
  final CurrencyRepository currencyRepo;
  final GetGachaRoll performGachaRollUseCase;

  const GachaPage({
    super.key,
    required this.banner,
    required this.gachaPort,
    required this.sessionToken,
    required this.currencyRepo,
    required this.performGachaRollUseCase,
  });

  @override
  State<GachaPage> createState() => _GachaPageState();
}

class _GachaPageState extends State<GachaPage> {
  CurrencyType _selectedCurrency = CurrencyType.permitTen;
  Currency _currency = const Currency();
  bool _isLoadingCurrency = true;
  bool _isRolling = false;

  @override
  void initState() {
    super.initState();
    _loadCurrency();
  }

  Future<void> _loadCurrency() async {
    final currencyData = await widget.currencyRepo.getCurrency();
    if (!mounted) return;
    setState(() {
      _currency = currencyData;
      _isLoadingCurrency = false;
    });
  }

  int _getCurrencyAmount(CurrencyType type) {
    return switch (type) {
      CurrencyType.permitTen => _currency.permitTen,
      CurrencyType.permitOne => _currency.permitOne,
      CurrencyType.originite => _currency.originite,
      CurrencyType.orundum => _currency.orundum,
    };
  }

  RollCurrencyType _mapToRollCurrencyType(CurrencyType type) {
    return switch (type) {
      CurrencyType.permitTen => RollCurrencyType.permitTen,
      CurrencyType.permitOne => RollCurrencyType.permitOne,
      CurrencyType.originite => RollCurrencyType.originite,
      CurrencyType.orundum => RollCurrencyType.orundum,
    };
  }

  Future<void> _performRoll(int count) async {
    if (_isRolling) return;

    setState(() => _isRolling = true);

    try {
      final results = await widget.performGachaRollUseCase.execute(
        bannerName: widget.banner.name,
        sessionToken: widget.sessionToken,
        currencyType: _mapToRollCurrencyType(_selectedCurrency),
        count: count,
      );

      await _loadCurrency();

      if (!mounted) return;
      GachaResultsDialog.show(context, results);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Roll failed: ${e.toString().replaceAll('Exception: ', '')}',
          ),
          backgroundColor: Colors.redAccent,
        ),
      );
    } finally {
      if (mounted) setState(() => _isRolling = false);
    }
  }

  Future<void> _handleTopUp(CurrencyType type, int amount) async {
    final updated = switch (type) {
      CurrencyType.permitTen => _currency.copyWith(
        permitTen: _currency.permitTen + amount,
      ),
      CurrencyType.permitOne => _currency.copyWith(
        permitOne: _currency.permitOne + amount,
      ),
      CurrencyType.originite => _currency.copyWith(
        originite: _currency.originite + amount,
      ),
      CurrencyType.orundum => _currency.copyWith(
        orundum: _currency.orundum + amount,
      ),
    };

    await widget.currencyRepo.saveCurrency(updated);
    await _loadCurrency();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text(
          'Headhunting Terminal',
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            CurrencySelector(
              selectedCurrency: _selectedCurrency,
              isLoading: _isLoadingCurrency,
              getAmount: _getCurrencyAmount,
              onSelect: (type) => setState(() => _selectedCurrency = type),
              onTopUp: (type) => TopUpModal.show(
                context,
                type,
                (amt) => _handleTopUp(type, amt),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: BannerDetails(
                banner: widget.banner,
                imageUrl: widget.gachaPort.getBannerCoverUrl(
                  widget.banner.name,
                ),
              ),
            ),
            GachaActionButtons(
              isRolling: _isRolling,
              onRoll: _performRoll,
              onCustomRoll: () => CustomRollModal.show(context, _performRoll),
            ),
          ],
        ),
      ),
    );
  }
}
