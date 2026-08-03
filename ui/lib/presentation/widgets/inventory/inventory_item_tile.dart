import 'package:flutter/material.dart';
import 'package:ui/domain/ports/gacha_port.dart';

class OperatorGridCard extends StatelessWidget {
  final String operatorId;
  final GachaPort gachaPort;

  const OperatorGridCard({
    super.key,
    required this.operatorId,
    required this.gachaPort,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white12),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned.fill(
            child: Image.network(
              gachaPort.getOperatorCardUrl(operatorId),
              fit: BoxFit.cover,
              alignment: const Alignment(0.0, -0.6),
              errorBuilder: (_, __, ___) => Container(
                color: Colors.grey[900],
                child: const Icon(
                  Icons.person_rounded,
                  color: Colors.white38,
                  size: 32,
                ),
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.transparent, Colors.black87],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: Text(
                operatorId.toUpperCase(),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
