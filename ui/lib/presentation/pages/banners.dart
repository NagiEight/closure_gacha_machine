import 'package:flutter/material.dart';
import 'package:ui/application/use_cases/get_banners.dart';
import 'package:ui/application/use_cases/get_gacha_roll.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/domain/repositories/currency_repository.dart';
import 'package:ui/domain/repositories/gacha_collection_repository.dart';
import 'package:ui/presentation/widgets/banners/banner_card.dart';
import 'package:ui/presentation/widgets/banners/region_pill.dart';

enum BannerSortOption { newest, oldest, name }

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
  final TextEditingController _searchController = TextEditingController();
  bool _isSearching = false;
  String _searchQuery = '';
  BannerSortOption _sortOption = BannerSortOption.newest;

  final List<BannerEntity> _banners = [];
  bool _isLoading = false;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMorePages = true;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.trim().toLowerCase();
      });
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchNextBannerPage();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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

  // Future<void> _onRegionChanged(ServerRegion region) async {
  //   if (_selectedRegion == region) return;

  //   setState(() {
  //     _selectedRegion = region;
  //     _banners.clear();
  //     _currentPage = 1;
  //     _hasMorePages = true;
  //   });

  //   await _fetchNextBannerPage();
  // }

  List<BannerEntity> get _filteredAndSortedBanners {
    var list = _banners.where((banner) {
      if (_searchQuery.isEmpty) return true;
      return banner.name.toLowerCase().contains(_searchQuery);
    }).toList();

    list.sort((a, b) {
      switch (_sortOption) {
        case BannerSortOption.newest:
          return b.releaseDate.compareTo(a.releaseDate);
        case BannerSortOption.oldest:
          return a.releaseDate.compareTo(b.releaseDate);
        case BannerSortOption.name:
          return a.name.compareTo(b.name);
      }
    });

    return list;
  }

  @override
  Widget build(BuildContext context) {
    final displayedBanners = _filteredAndSortedBanners;

    // Determine the true newest banner from all fetched banners to keep it active correctly
    BannerEntity? newestBanner;
    if (_banners.isNotEmpty) {
      newestBanner = _banners.reduce(
        (curr, next) =>
            curr.releaseDate.isAfter(next.releaseDate) ? curr : next,
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: const TextStyle(color: Colors.white, fontSize: 16),
                decoration: const InputDecoration(
                  hintText: 'Search banners...',
                  hintStyle: TextStyle(color: Colors.white54),
                  border: InputBorder.none,
                ),
              )
            : null,
        // : RegionSelectorPill(
        //     selectedRegion: _selectedRegion,
        //     onRegionChanged: _onRegionChanged,
        //   ),
        leading: _isSearching
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () {
                  setState(() {
                    _isSearching = false;
                    _searchController.clear();
                    _searchQuery = '';
                  });
                },
              )
            : null,
        actions: [
          if (!_isSearching)
            IconButton(
              icon: const Icon(Icons.search, color: Colors.amber),
              onPressed: () => setState(() => _isSearching = true),
            ),
          PopupMenuButton<BannerSortOption>(
            icon: const Icon(Icons.sort, color: Colors.amber),
            color: const Color(0xFF1E1E1E),
            onSelected: (value) => setState(() => _sortOption = value),
            itemBuilder: (context) => const [
              PopupMenuItem(
                value: BannerSortOption.newest,
                child: Text('Newest', style: TextStyle(color: Colors.white)),
              ),
              PopupMenuItem(
                value: BannerSortOption.oldest,
                child: Text('Oldest', style: TextStyle(color: Colors.white)),
              ),
              PopupMenuItem(
                value: BannerSortOption.name,
                child: Text('Name', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ],
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
              if (displayedBanners.isEmpty &&
                  !_isLoading &&
                  _errorMessage == null)
                const SliverFillRemaining(
                  child: Center(
                    child: Text(
                      'No banners found.',
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
              if (displayedBanners.isNotEmpty)
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate((context, index) {
                      final banner = displayedBanners[index];
                      final isActive =
                          newestBanner != null &&
                          banner.name == newestBanner.name;

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
                    }, childCount: displayedBanners.length),
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
