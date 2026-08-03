import 'package:flutter/material.dart';
import 'package:ui/application/use_cases/get_gacha_roll.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/domain/repositories/currency_repository.dart';
import 'package:ui/domain/repositories/gacha_collection_repository.dart';
import 'package:ui/presentation/pages/history.dart';
import 'package:ui/presentation/widgets/gacha/banner_details.dart';
import 'package:ui/presentation/widgets/gacha/gacha_action_button.dart';
import 'package:ui/presentation/widgets/gacha/gacha_modals.dart';
import 'package:ui/presentation/widgets/gacha/gacha_result_dialog.dart';

class GachaPage extends StatefulWidget {
  final BannerEntity banner;
  final GachaPort gachaPort;
  final String sessionToken;
  final CurrencyRepository currencyRepo;
  final GachaCollectionRepository collectionRepo;
  final GetGachaRoll performGachaRollUseCase;

  const GachaPage({
    super.key,
    required this.banner,
    required this.gachaPort,
    required this.sessionToken,
    required this.currencyRepo,
    required this.collectionRepo,
    required this.performGachaRollUseCase,
  });

  @override
  State<GachaPage> createState() => _GachaPageState();
}

class _GachaPageState extends State<GachaPage> {
  bool _isRolling = false;

  Future<void> _performRoll(int count) async {
    if (_isRolling || count <= 0) return;

    setState(() => _isRolling = true);

    try {
      final results = await widget.performGachaRollUseCase.execute(
        bannerName: widget.banner.name,
        sessionToken: widget.sessionToken,
        count: count,
      );

      if (!mounted) return;
      await GachaResultsDialog.show(context, results, widget.gachaPort);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Headhunt failed: ${e.toString().replaceAll('Exception: ', '')}',
          ),
          backgroundColor: Colors.redAccent,
        ),
      );
    } finally {
      if (mounted) setState(() => _isRolling = false);
    }
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
          'HEADHUNTING TERMINAL',
          style: TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontFamily: 'bender',
            letterSpacing: 1.5,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded, color: Colors.amber),
            tooltip: 'Recruitment History',
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => HistoryPage(
                    collectionRepo: widget.collectionRepo,
                    gachaPort: widget.gachaPort,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: BannerDetailsWidget(
                banner: widget.banner,
                gachaPort: widget.gachaPort,
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
