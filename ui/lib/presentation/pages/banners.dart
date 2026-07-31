import 'package:flutter/material.dart';
import 'package:ui/application/use_cases/get_gacha_roll.dart';
import 'package:ui/domain/repositories/currency_repository.dart';
import 'package:ui/presentation/pages/gacha.dart';
import '../../../application/use_cases/get_banners.dart';
import '../../../domain/ports/gacha_port.dart';
import '../../domain/entities/api_entities.dart';

enum ServerRegion { en, cn, jp }

class BannersPage extends StatefulWidget {
  final GetBanners getBannersUseCase;
  final GachaPort gachaPort;
  final CurrencyRepository currencyRepo;
  final GetGachaRoll performGachaRollUseCase;

  const BannersPage({
    super.key,
    required this.getBannersUseCase,
    required this.gachaPort,
    required this.currencyRepo,
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
        title: _RegionSelectorPill(
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
                        child: _BannerCard(
                          banner: banner,
                          isActive: isActive,
                          gachaPort: widget.gachaPort,
                          currencyRepo: widget.currencyRepo,
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

class _RegionSelectorPill extends StatelessWidget {
  final ServerRegion selectedRegion;
  final ValueChanged<ServerRegion> onRegionChanged;

  const _RegionSelectorPill({
    required this.selectedRegion,
    required this.onRegionChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey[800]!),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: ServerRegion.values.map((region) {
          final isSelected = selectedRegion == region;
          return GestureDetector(
            onTap: () => onRegionChanged(region),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: isSelected ? Colors.amber[700] : Colors.transparent,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                region.name.toUpperCase(),
                style: TextStyle(
                  color: isSelected ? Colors.black : Colors.white70,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _BannerCard extends StatelessWidget {
  final BannerEntity banner;
  final bool isActive;
  final GachaPort gachaPort;
  final CurrencyRepository currencyRepo;
  final GetGachaRoll performGachaRollUseCase;

  const _BannerCard({
    required this.banner,
    required this.isActive,
    required this.gachaPort,
    required this.currencyRepo,
    required this.performGachaRollUseCase,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor = Colors.amber[600]!;
    final imageUrl = gachaPort.getBannerCoverUrl(banner.name);

    final featuredList = [
      ...banner.operatorPool.sixStars.primary,
      ...banner.operatorPool.sixStars.secondary,
    ];

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive ? activeColor : Colors.grey[850]!,
          width: isActive ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 7,
            child: Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) => Container(
                color: Colors.grey[900],
                child: const Center(
                  child: Icon(Icons.broken_image, color: Colors.white38),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: isActive
                            ? activeColor.withValues(alpha: 0.2)
                            : Colors.grey[800],
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isActive
                            ? 'ACTIVE'
                            : 'Released: ${banner.releaseDate.toIso8601String().split('T').first}',
                        style: TextStyle(
                          color: isActive ? activeColor : Colors.grey[400],
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Text(
                      banner.type.name.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  banner.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (featuredList.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    'Featured: ${featuredList.join(", ")}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: Colors.grey[400], fontSize: 13),
                  ),
                ],
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isActive
                          ? activeColor
                          : Colors.grey[800],
                      foregroundColor: isActive ? Colors.black : Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: () async {
                      try {
                        final session = await gachaPort.createSession();

                        if (!context.mounted) return;

                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => GachaPage(
                              banner: banner,
                              gachaPort: gachaPort,
                              sessionToken: session.token,
                              currencyRepo: currencyRepo,
                              performGachaRollUseCase: performGachaRollUseCase,
                            ),
                          ),
                        );
                      } catch (e) {
                        if (!context.mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Failed to start session: $e'),
                            backgroundColor: Colors.redAccent,
                          ),
                        );
                      }
                    },
                    child: Text(
                      isActive ? 'Simulate Banner' : 'Preview Pool',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
