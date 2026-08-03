import 'package:flutter/material.dart';
import 'package:ui/application/use_cases/get_banners.dart';
import 'package:ui/application/use_cases/get_gacha_roll.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/domain/repositories/currency_repository.dart';
import 'package:ui/domain/repositories/gacha_collection_repository.dart';
import 'package:ui/presentation/widgets/banners/banner_card.dart';
import 'package:ui/presentation/widgets/banners/region_pill.dart';

class BannersPage extends StatefulWidget {
  final GetBanners getBannersUseCase;
  final GachaPort gachaPort;
  final CurrencyRepository currencyRepo;
  final GachaCollectionRepository collectionRepo;
  final GetGachaRoll performGachaRollUseCase;

  const BannersPage({
    super.key,
    required this.getBannersUseCase,
    required this.gachaPort,
    required this.currencyRepo,
    required this.collectionRepo,
    required this.performGachaRollUseCase,
  });

  @override
  State<BannersPage> createState() => _BannersPageState();
}

class _BannersPageState extends State<BannersPage> {
  ServerRegion _selectedRegion = ServerRegion.en;

  final List<BannerEntity> _banners = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMorePages = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchNextBannerPage();
    });
  }

  Future<void> _fetchNextBannerPage() async {
    if (_isLoading || !_hasMorePages) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final newBanners = await widget.getBannersUseCase.execute(
        page: _currentPage,
        regionPrefix: _selectedRegion.name,
      );

      if (newBanners.isEmpty) {
        setState(() {
          _hasMorePages = false;
          _isLoading = false;
        });
        return;
      }

      setState(() {
        _banners.addAll(newBanners);
        _currentPage++;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = e.toString();
      });
    }
  }

  Future<void> _onRegionChanged(ServerRegion region) async {
    if (_selectedRegion == region) return;

    setState(() {
      _selectedRegion = region;
      _banners.clear();
      _currentPage = 1;
      _hasMorePages = true;
    });

    await _fetchNextBannerPage();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: RegionSelectorPill(
          selectedRegion: _selectedRegion,
          onRegionChanged: _onRegionChanged,
        ),
        centerTitle: true,
      ),
      body: NotificationListener<ScrollNotification>(
        onNotification: (ScrollNotification scrollInfo) {
          if (scrollInfo.metrics.pixels >=
              scrollInfo.metrics.maxScrollExtent - 200) {
            _fetchNextBannerPage();
          }
          return false;
        },
        child: RefreshIndicator(
          onRefresh: () async {
            setState(() {
              _banners.clear();
              _currentPage = 1;
              _hasMorePages = true;
            });
            await _fetchNextBannerPage();
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              if (_banners.isEmpty && !_isLoading && _errorMessage == null)
                const SliverFillRemaining(
                  child: Center(
                    child: Text(
                      'No banners found for this region.',
                      style: TextStyle(color: Colors.white54),
                    ),
                  ),
                ),
              if (_errorMessage != null && _banners.isEmpty)
                SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.redAccent),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: _fetchNextBannerPage,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              if (_banners.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate((context, index) {
                      final banner = _banners[index];
                      final isActive = index == 0;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: BannerCard(
                          banner: banner,
                          isActive: isActive,
                          gachaPort: widget.gachaPort,
                          currencyRepo: widget.currencyRepo,
                          collectionRepo: widget.collectionRepo,
                          performGachaRollUseCase:
                              widget.performGachaRollUseCase,
                        ),
                      );
                    }, childCount: _banners.length),
                  ),
                ),
              if (_isLoading)
                const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: CircularProgressIndicator(color: Colors.amber),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
