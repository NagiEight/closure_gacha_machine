// presentation/pages/dashboard_page.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/domain/repositories/gacha_collection_repository.dart';
import 'package:ui/presentation/widgets/analytics/analytics_card.dart';
import 'package:ui/presentation/widgets/analytics/pull_distribution_card.dart';
import 'package:ui/presentation/widgets/analytics/rarity_timeline_chart.dart';
import 'package:ui/presentation/widgets/dashboard/despair_index_card.dart';
import 'package:ui/presentation/widgets/dashboard/investment_card.dart';
import 'package:ui/presentation/widgets/dashboard/overview_section.dart';

class _AnalyticsData {
  final Map<int, int> rarityCounts;
  final Map<String, int> operatorRarities;
  final double despairIndex;
  final int sixStarCount;
  final int currentPityCount;

  const _AnalyticsData({
    required this.rarityCounts,
    required this.operatorRarities,
    required this.despairIndex,
    required this.sixStarCount,
    required this.currentPityCount,
  });
}

class DashboardPage extends StatefulWidget {
  final GachaCollectionRepository collectionRepo;
  final GachaPort gachaPort;

  const DashboardPage({
    super.key,
    required this.collectionRepo,
    required this.gachaPort,
  });

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  GachaCollection _collection = const GachaCollection();
  bool _isLoading = true;
  Future<_AnalyticsData>? _analyticsFuture;
  StreamSubscription<GachaCollection>? _collectionSubscription;

  @override
  void initState() {
    super.initState();
    _initDataAndListen();
  }

  void _initDataAndListen() {
    _loadData();

    _collectionSubscription = widget.collectionRepo.watchCollection().listen((
      updatedCollection,
    ) {
      if (!mounted) return;
      setState(() {
        _collection = updatedCollection;
        _analyticsFuture = _processAnalytics(updatedCollection);
      });
    });
  }

  @override
  void dispose() {
    _collectionSubscription?.cancel();
    super.dispose();
  }

  Future<void> _loadData() async {
    final data = await widget.collectionRepo.getCollection();
    if (!mounted) return;

    setState(() {
      _collection = data;
      _analyticsFuture = _processAnalytics(data);
      _isLoading = false;
    });
  }

  Future<_AnalyticsData> _processAnalytics(GachaCollection collection) async {
    final rarityCounts = <int, int>{6: 0, 5: 0, 4: 0, 3: 0};
    final operatorRarities = <String, int>{};

    int sixStarsCount = 0;
    int pullsSinceLastSixStar = 0;

    if (collection.history.isNotEmpty) {
      for (final entry in collection.history) {
        Operator? op;
        try {
          op = await widget.gachaPort.getOperatorDetails(entry.operatorId);
        } catch (_) {
          op = null;
        }

        final rarity = op?.rarity ?? 3;
        rarityCounts[rarity] = (rarityCounts[rarity] ?? 0) + 1;
        operatorRarities[entry.operatorId] = rarity;

        if (rarity == 6) {
          sixStarsCount++;
          pullsSinceLastSixStar = 0;
        } else {
          pullsSinceLastSixStar++;
        }
      }
    }

    double despairProbability = 1.0;
    for (int i = 1; i <= pullsSinceLastSixStar; i++) {
      double currentRate = 0.02;
      if (i > 50) {
        currentRate += (i - 50) * 0.02;
      }
      currentRate = currentRate.clamp(0.02, 1.0);
      despairProbability *= (1.0 - currentRate);
    }

    final despairIndex = ((1.0 - despairProbability) * 100).clamp(0.0, 99.9);

    return _AnalyticsData(
      rarityCounts: rarityCounts,
      operatorRarities: operatorRarities,
      despairIndex: despairIndex,
      sixStarCount: sixStarsCount,
      currentPityCount: pullsSinceLastSixStar,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF121212),
        body: Center(child: CircularProgressIndicator(color: Colors.amber)),
      );
    }

    final totalPulls = _collection.totalRolls;
    final uniqueOps = _collection.acquiredOperatorIds.toSet().length;

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'RECRUITMENT ANALYTICS',
          style: TextStyle(
            color: Colors.white,
            fontSize: 14,
            letterSpacing: 2,
            fontFamily: 'monospace',
          ),
        ),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: Colors.amber,
        backgroundColor: const Color(0xFF1E1E1E),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            OverviewSection(totalPulls: totalPulls, uniqueOps: uniqueOps),
            const SizedBox(height: 16),
            const SizedBox(height: 16),
            FutureBuilder<_AnalyticsData>(
              future: _analyticsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 40),
                    child: Center(
                      child: CircularProgressIndicator(
                        color: Colors.amber,
                        strokeWidth: 2,
                      ),
                    ),
                  );
                }

                final analytics =
                    snapshot.data ??
                    const _AnalyticsData(
                      rarityCounts: {6: 0, 5: 0, 4: 0, 3: 0},
                      operatorRarities: {},
                      despairIndex: 0.0,
                      sixStarCount: 0,
                      currentPityCount: 0,
                    );

                return Column(
                  children: [
                    DespairIndexCard(
                      currentPityCount: analytics.currentPityCount,
                      despairIndex: analytics.despairIndex,
                    ),
                    const SizedBox(height: 16),
                    AnalyticsCard(
                      title: 'RARITY VS PULL TIMELINE',
                      child: RarityTimelineChart(
                        history: _collection.history,
                        operatorRarities: analytics.operatorRarities,
                      ),
                    ),
                    const SizedBox(height: 16),
                    AnalyticsCard(
                      title: 'RARITY DISTRIBUTION',
                      child: PullDistributionChart(
                        rarityCounts: analytics.rarityCounts,
                        totalPulls: totalPulls,
                      ),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 16),
            InvestmentCard(totalPulls: totalPulls),
          ],
        ),
      ),
    );
  }
}
