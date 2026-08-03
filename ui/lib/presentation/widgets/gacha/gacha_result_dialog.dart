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

  @override
  void initState() {
    super.initState();
    if (widget.operatorIds.length > 10) {
      _showRightArrow = true;
      _scrollController.addListener(_onScroll);
    }
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

  Widget _buildSingleOperatorCard(String id, double height) {
    final width = height * 0.5; // Maintains 180:360 ratio at natural scale
    return SizedBox(
      width: width,
      height: height,
      child: Image.network(
        widget.gachaPort.getOperatorCardUrl(id),
        fit: BoxFit.cover,
        alignment: Alignment.center,
        errorBuilder: (_, __, ___) =>
            const Icon(Icons.person, color: Colors.white, size: 36),
      ),
    );
  }

  Widget _buildGridOperatorCard(String id, double width, double height) {
    return SizedBox(
      width: width,
      height: height,
      child: Image.network(
        widget.gachaPort.getOperatorCardUrl(id),
        fit: BoxFit.cover,
        alignment: Alignment.center,
        errorBuilder: (_, __, ___) =>
            const Icon(Icons.person, color: Colors.white, size: 36),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final screenWidth = mediaQuery.size.width;
    final screenHeight = mediaQuery.size.height;

    final isSingle = widget.operatorIds.length == 1;

    // Grid measurements for multiple operators
    final cardWidth = screenWidth * 0.20;
    final cardHeight = cardWidth * 2;

    final int halfLength = (widget.operatorIds.length / 2).ceil();
    final row1 = widget.operatorIds.take(halfLength).toList();
    final row2 = widget.operatorIds.skip(halfLength).toList();

    return Dialog.fullscreen(
      backgroundColor: Colors.black.withOpacity(0.85),
      child: Column(
        children: [
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                'Headhunt Acquisition (${widget.operatorIds.length})',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          Expanded(
            child: isSingle
                ? Center(
                    child: _buildSingleOperatorCard(
                      widget.operatorIds.first,
                      screenHeight * 0.6, // Displays at full natural size
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
                                children: row1
                                    .map(
                                      (id) => _buildGridOperatorCard(
                                        id,
                                        cardWidth,
                                        cardHeight,
                                      ),
                                    )
                                    .toList(),
                              ),
                              if (row2.isNotEmpty)
                                Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: row2
                                      .map(
                                        (id) => _buildGridOperatorCard(
                                          id,
                                          cardWidth,
                                          cardHeight,
                                        ),
                                      )
                                      .toList(),
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
                                  color: Colors.black.withOpacity(0.6),
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
