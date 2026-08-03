import 'dart:async';
import 'package:flutter/material.dart';
import 'package:ui/domain/ports/gacha_port.dart';

class GachaLoadingScreen extends StatefulWidget {
  final Future<List<String>> Function() fetchGachaResults;
  final GachaPort gachaPort;
  final void Function(List<String> results) onComplete;

  const GachaLoadingScreen({
    super.key,
    required this.fetchGachaResults,
    required this.gachaPort,
    required this.onComplete,
  });

  @override
  State<GachaLoadingScreen> createState() => _GachaLoadingScreenState();
}

class _GachaLoadingScreenState extends State<GachaLoadingScreen> {
  double _progress = 0.0;
  Timer? _timer;
  bool _isAssetsReady = false;
  List<String>? _results;

  static const List<String> _loadingSteps = [
    'CONNECTING TO PRTS TERMINAL...',
    'AUTHORIZING HEADHUNT PERMIT...',
    'ESTABLISHING NEURAL LINK...',
    'DOWNLOADING OPERATOR DATA...',
    'PRECACHING VISUAL ASSETS...',
    'FINALIZING ACQUISITION...',
  ];

  @override
  void initState() {
    super.initState();
    _startLoadingProcess();
  }

  void _startLoadingProcess() async {
    // 1. Fetch operator IDs from API
    widget.fetchGachaResults().then((results) async {
      if (!mounted) return;
      _results = results;

      // 2. Pre-cache every operator image in memory before proceeding
      await Future.wait(
        results.map((id) {
          final url = widget.gachaPort.getOperatorCardUrl(id);
          return precacheImage(NetworkImage(url), context);
        }),
      );

      if (mounted) {
        _isAssetsReady = true;
      }
    });

    // 3. Smooth progress animation
    _timer = Timer.periodic(const Duration(milliseconds: 30), (timer) {
      if (!mounted) return;

      setState(() {
        if (_progress < 0.9) {
          _progress += 0.015;
        } else if (_isAssetsReady) {
          _progress = 1.0;
        }
      });

      if (_progress >= 1.0 && _isAssetsReady) {
        _timer?.cancel();
        Future.delayed(const Duration(milliseconds: 150), () {
          if (mounted && _results != null) {
            widget.onComplete(_results!);
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  String _buildAsciiBar(double progress) {
    const totalBlocks = 10;
    final filledBlocks = (progress * totalBlocks).round();
    final emptyBlocks = totalBlocks - filledBlocks;
    return '[${'■' * filledBlocks}${'_' * emptyBlocks}]';
  }

  String _getStepStatus(double progress) {
    if (progress >= 1.0) return _loadingSteps.last;
    final index = (progress * (_loadingSteps.length - 1)).floor();
    return _loadingSteps[index];
  }

  @override
  Widget build(BuildContext context) {
    final percentage = (_progress * 100).clamp(0, 100).toInt();

    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _buildAsciiBar(_progress),
              style: const TextStyle(
                color: Colors.amber,
                fontFamily: 'monospace',
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              '- LOADING $percentage% -',
              style: const TextStyle(
                color: Colors.amber,
                fontFamily: 'monospace',
                fontSize: 16,
                letterSpacing: 3,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              _getStepStatus(_progress),
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
