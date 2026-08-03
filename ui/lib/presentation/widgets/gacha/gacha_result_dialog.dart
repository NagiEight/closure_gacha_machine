import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:ui/domain/ports/gacha_port.dart';

class GachaResultsDialog extends StatefulWidget {
  final List<String> operatorIds;
  final GachaPort gachaPort;

  const GachaResultsDialog({
    super.key,
    required this.operatorIds,
    required this.gachaPort,
  });

  static Future<void> show(
    BuildContext context,
    List<String> results,
    GachaPort gachaPort,
  ) {
    return showDialog(
      context: context,
      builder: (_) =>
          GachaResultsDialog(operatorIds: results, gachaPort: gachaPort),
    );
  }

  @override
  State<GachaResultsDialog> createState() => _GachaResultsDialogState();
}

class _GachaResultsDialogState extends State<GachaResultsDialog> {
  final ScrollController _scrollController = ScrollController();
  bool _showRightArrow = false;
  late final List<bool> _revealed;

  @override
  void initState() {
    super.initState();
    _revealed = List.filled(widget.operatorIds.length, false);

    if (widget.operatorIds.length > 10) {
      _showRightArrow = true;
      _scrollController.addListener(_onScroll);
    }

    _revealCardsRandomly();
  }

  final List<String> _terminalLogs = [];
  final ScrollController _terminalScrollController = ScrollController();

  // 2. Append fake logs during your reveal sequence
  Future<void> _revealCardsRandomly() async {
    final count = widget.operatorIds.length;
    final indices = List.generate(count, (i) => i)..shuffle();

    // Clamp overall reveal sequence to ~1.5 to 3 seconds max
    final totalDurationMs = (count * 50).clamp(1500, 3000);
    final intervalMs = (totalDurationMs / count).round();

    _addLog('[SYS_INIT] Initializing batch acquisition ($count units)...');

    for (final index in indices) {
      await Future.delayed(Duration(milliseconds: intervalMs));
      if (!mounted) return;

      setState(() {
        _revealed[index] = true;
        _addLog('[ACQUIRED] Op_ID: ${widget.operatorIds[index]} resolved.');
      });
    }

    _addLog('[SUCCESS] All $count signals decrypted.');
  }

  void _addLog(String log) {
    _terminalLogs.add(log);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_terminalScrollController.hasClients) {
        _terminalScrollController.jumpTo(
          _terminalScrollController.position.maxScrollExtent,
        );
      }
    });
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;

    if (currentScroll >= maxScroll - 20 && _showRightArrow) {
      setState(() => _showRightArrow = false);
    } else if (currentScroll < maxScroll - 20 && !_showRightArrow) {
      setState(() => _showRightArrow = true);
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  Widget _buildOperatorCard({
    required String id,
    required double width,
    required double height,
    required int index,
  }) {
    final isRevealed = _revealed[index];

    return SizedBox(
      width: width,
      height: height,
      child: Stack(
        children: [
          Positioned.fill(
            child: CachedNetworkImage(
              imageUrl: widget.gachaPort.getOperatorCardUrl(id),
              fit: BoxFit.cover,
              alignment: Alignment.center,
            ),
          ),
          ClipRect(
            child: Align(
              alignment: Alignment.bottomCenter,
              child: AnimatedFractionallySizedBox(
                duration: const Duration(milliseconds: 350),
                curve: Curves.easeInOut,
                heightFactor: isRevealed ? 0.0 : 1.0,
                widthFactor: 1.0,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  // Flashes white briefly as it begins revealing!
                  color: isRevealed ? Colors.white : Colors.amber,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTerminalOverlay() {
    return Container(
      height: 60,
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(),
        border: Border.all(color: Colors.amber.withValues()),
        borderRadius: BorderRadius.circular(4),
      ),
      child: ListView.builder(
        controller: _terminalScrollController,
        itemCount: _terminalLogs.length,
        itemBuilder: (_, index) => Text(
          _terminalLogs[index],
          style: const TextStyle(
            color: Colors.amberAccent,
            fontFamily: 'monospace',
            fontSize: 11,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final screenWidth = mediaQuery.size.width;
    final screenHeight = mediaQuery.size.height;

    final isSingle = widget.operatorIds.length == 1;

    final cardWidth = screenWidth * 0.20;
    final cardHeight = cardWidth * 2;

    final singleHeight = screenHeight * 0.6;
    final singleWidth = singleHeight * 0.5;

    final int halfLength = (widget.operatorIds.length / 2).ceil();

    return Dialog.fullscreen(
      backgroundColor: Colors.black.withValues(),
      child: Column(
        children: [
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                '-HEADHUNT ACQUISITION (${widget.operatorIds.length})-',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontFamily: 'bender',
                  letterSpacing: 2.0,
                ),
              ),
            ),
          ),
          Expanded(
            child: isSingle
                ? Center(
                    child: _buildOperatorCard(
                      id: widget.operatorIds.first,
                      width: singleWidth,
                      height: singleHeight,
                      index: 0,
                    ),
                  )
                : Stack(
                    alignment: Alignment.center,
                    children: [
                      Center(
                        child: SingleChildScrollView(
                          controller: _scrollController,
                          scrollDirection: Axis.horizontal,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: List.generate(
                                  halfLength,
                                  (i) => _buildOperatorCard(
                                    id: widget.operatorIds[i],
                                    width: cardWidth,
                                    height: cardHeight,
                                    index: i,
                                  ),
                                ),
                              ),
                              if (widget.operatorIds.length > 1)
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: List.generate(
                                    widget.operatorIds.length - halfLength,
                                    (i) {
                                      final index = halfLength + i;
                                      return _buildOperatorCard(
                                        id: widget.operatorIds[index],
                                        width: cardWidth,
                                        height: cardHeight,
                                        index: index,
                                      );
                                    },
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),
                      if (_showRightArrow)
                        Positioned(
                          right: 12,
                          child: IgnorePointer(
                            child: AnimatedOpacity(
                              duration: const Duration(milliseconds: 300),
                              opacity: _showRightArrow ? 1.0 : 0.0,
                              child: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.arrow_forward_ios_rounded,
                                  color: Colors.amber,
                                  size: 28,
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
          _buildTerminalOverlay(),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: SizedBox(
                width: 200,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.amber,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text(
                    'Dismiss',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
