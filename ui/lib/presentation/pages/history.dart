// presentation/pages/history_page.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/domain/repositories/gacha_collection_repository.dart';
import 'package:ui/presentation/widgets/history/history_item_tile.dart';
import 'package:ui/presentation/widgets/history/history_sort_sheet.dart';
import 'package:ui/presentation/widgets/history/history_stats_card.dart';
import 'package:ui/presentation/widgets/history/unique_operator_tile.dart';

enum HistoryViewMode { detailed, simplified }

class UniqueOperatorSummary {
  final String operatorId;
  final int count;
  final DateTime firstPulled;
  final DateTime lastPulled;

  const UniqueOperatorSummary({
    required this.operatorId,
    required this.count,
    required this.firstPulled,
    required this.lastPulled,
  });
}

class HistoryPage extends StatefulWidget {
  final GachaCollectionRepository collectionRepo;
  final GachaPort gachaPort;

  const HistoryPage({
    super.key,
    required this.collectionRepo,
    required this.gachaPort,
  });

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  GachaCollection _collection = const GachaCollection();
  bool _isLoading = true;
  StreamSubscription<GachaCollection>? _collectionSubscription;

  // View state
  HistoryViewMode _viewMode = HistoryViewMode.detailed;

  // Search & Sort state
  bool _isSearching = false;
  String _searchQuery = '';
  HistorySortOption _currentSort = HistorySortOption.newest;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initDataAndListen();
  }

  void _initDataAndListen() {
    _loadHistory();

    _collectionSubscription = widget.collectionRepo.watchCollection().listen((
      collection,
    ) {
      if (!mounted) return;
      setState(() {
        _collection = collection;
      });
    });
  }

  @override
  void dispose() {
    _collectionSubscription?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    final data = await widget.collectionRepo.getCollection();
    if (!mounted) return;
    setState(() {
      _collection = data;
      _isLoading = false;
    });
  }

  List<HistoryEntry> _getProcessedLogs() {
    var logs = List<HistoryEntry>.from(_collection.history);

    if (_searchQuery.isNotEmpty) {
      logs = logs
          .where(
            (e) =>
                e.operatorId.toLowerCase().contains(_searchQuery.toLowerCase()),
          )
          .toList();
    }

    switch (_currentSort) {
      case HistorySortOption.newest:
        logs.sort((a, b) => b.timestamp.compareTo(a.timestamp));
        break;
      case HistorySortOption.oldest:
        logs.sort((a, b) => a.timestamp.compareTo(b.timestamp));
        break;
      case HistorySortOption.nameAsc:
        logs.sort((a, b) => a.operatorId.compareTo(b.operatorId));
        break;
      case HistorySortOption.nameDesc:
        logs.sort((a, b) => b.operatorId.compareTo(a.operatorId));
        break;
      case HistorySortOption.onlyNew:
        logs = logs.where((e) => e.isNew).toList();
        logs.sort((a, b) => b.timestamp.compareTo(a.timestamp));
        break;
    }

    return logs;
  }

  List<UniqueOperatorSummary> _getSimplifiedSummaries() {
    final Map<String, List<HistoryEntry>> grouped = {};

    for (final entry in _collection.history) {
      if (_searchQuery.isNotEmpty &&
          !entry.operatorId.toLowerCase().contains(
            _searchQuery.toLowerCase(),
          )) {
        continue;
      }
      grouped.putIfAbsent(entry.operatorId, () => []).add(entry);
    }

    final summaries = grouped.entries.map((e) {
      final entries = e.value
        ..sort((a, b) => a.timestamp.compareTo(b.timestamp));
      return UniqueOperatorSummary(
        operatorId: e.key,
        count: entries.length,
        firstPulled: entries.first.timestamp,
        lastPulled: entries.last.timestamp,
      );
    }).toList();

    switch (_currentSort) {
      case HistorySortOption.newest:
        summaries.sort((a, b) => b.lastPulled.compareTo(a.lastPulled));
        break;
      case HistorySortOption.oldest:
        summaries.sort((a, b) => a.firstPulled.compareTo(a.firstPulled));
        break;
      case HistorySortOption.nameAsc:
        summaries.sort((a, b) => a.operatorId.compareTo(b.operatorId));
        break;
      case HistorySortOption.nameDesc:
        summaries.sort((a, b) => b.operatorId.compareTo(a.operatorId));
        break;
      case HistorySortOption.onlyNew:
        summaries.sort((a, b) => b.count.compareTo(a.count));
        break;
    }

    return summaries;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF121212),
        body: Center(child: CircularProgressIndicator(color: Colors.amber)),
      );
    }

    final logs = _getProcessedLogs();
    final summaries = _getSimplifiedSummaries();

    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: _isSearching
            ? TextField(
                controller: _searchController,
                autofocus: true,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: const InputDecoration(
                  hintText: 'Search operator...',
                  hintStyle: TextStyle(color: Colors.white38),
                  border: InputBorder.none,
                ),
                onChanged: (val) => setState(() => _searchQuery = val),
              )
            : Text(
                _viewMode == HistoryViewMode.detailed
                    ? 'RECRUITMENT LOGS'
                    : 'UNIQUE OPERATOR SUMMARY',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  letterSpacing: 2,
                  fontFamily: 'monospace',
                ),
              ),
        centerTitle: !_isSearching,
        actions: [
          IconButton(
            icon: Icon(
              _viewMode == HistoryViewMode.detailed
                  ? Icons.view_compact_rounded
                  : Icons.view_stream_rounded,
              color: Colors.amber,
            ),
            tooltip: _viewMode == HistoryViewMode.detailed
                ? 'Switch to Simplified View'
                : 'Switch to Detailed View',
            onPressed: () {
              setState(() {
                _viewMode = _viewMode == HistoryViewMode.detailed
                    ? HistoryViewMode.simplified
                    : HistoryViewMode.detailed;
              });
            },
          ),
          IconButton(
            icon: Icon(
              _isSearching ? Icons.close_rounded : Icons.search_rounded,
              color: Colors.amber,
            ),
            tooltip: _isSearching ? 'Close Search' : 'Search Operators',
            onPressed: () {
              setState(() {
                _isSearching = !_isSearching;
                if (!_isSearching) {
                  _searchQuery = '';
                  _searchController.clear();
                }
              });
            },
          ),
          IconButton(
            icon: const Icon(Icons.sort_rounded, color: Colors.amber),
            tooltip: 'Sort Logs',
            onPressed: () async {
              final selected = await HistorySortSheet.show(
                context,
                _currentSort,
              );
              if (selected != null) {
                setState(() => _currentSort = selected);
              }
            },
          ),
        ],
      ),
      body: Column(
        children: [
          HistoryStatsCard(
            totalRolls: _collection.totalRolls,
            uniqueAcquired: _collection.acquiredOperatorIds.toSet().length,
          ),
          const Divider(color: Colors.white12, height: 24),
          Expanded(
            child: _viewMode == HistoryViewMode.detailed
                ? (logs.isEmpty
                      ? const Center(
                          child: Text(
                            'NO MATCHING RECRUITMENT LOGS',
                            style: TextStyle(
                              color: Colors.white38,
                              fontFamily: 'monospace',
                              letterSpacing: 1.5,
                            ),
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: logs.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            return HistoryItemTile(
                              entry: logs[index],
                              gachaPort: widget.gachaPort,
                            );
                          },
                        ))
                : (summaries.isEmpty
                      ? const Center(
                          child: Text(
                            'NO OPERATOR RECORDS FOUND',
                            style: TextStyle(
                              color: Colors.white38,
                              fontFamily: 'monospace',
                              letterSpacing: 1.5,
                            ),
                          ),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: summaries.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            return UniqueOperatorTile(
                              summary: summaries[index],
                              gachaPort: widget.gachaPort,
                            );
                          },
                        )),
          ),
        ],
      ),
    );
  }
}
