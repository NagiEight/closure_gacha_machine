import 'package:flutter/material.dart';
import 'package:ui/presentation/painter/originite.dart';
import 'package:ui/presentation/painter/orundum.dart';
import 'package:ui/presentation/painter/permit_one.dart';
import 'package:ui/presentation/painter/permit_ten.dart';

enum CurrencyType { permitTen, permitOne, originite, orundum }

class CurrencyPill extends StatelessWidget {
  final CurrencyType type;
  final int amount;
  final bool isSelected;
  final VoidCallback onTap;
  final VoidCallback onTopUp;

  const CurrencyPill({
    super.key,
    required this.type,
    required this.amount,
    required this.isSelected,
    required this.onTap,
    required this.onTopUp,
  });

  Widget _buildIcon() {
    switch (type) {
      case CurrencyType.orundum:
        return CustomPaint(size: const Size(22, 22), painter: OrundumPainter());
      case CurrencyType.originite:
        return CustomPaint(
          size: const Size(22, 22),
          painter: OriginitePainter(),
        );
      case CurrencyType.permitOne:
        return CustomPaint(
          size: const Size(28.16, 17.6),
          painter: PermitOnePainter(),
        );
      case CurrencyType.permitTen:
        return CustomPaint(
          size: const Size(28.16, 17.6),
          painter: PermitTenPainter(),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.only(left: 8, right: 4, top: 4, bottom: 4),
        decoration: BoxDecoration(
          color: isSelected
              ? Colors.amber[900]!.withValues(alpha: 0.3)
              : const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? Colors.amber : Colors.grey[800]!,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildIcon(),
            const SizedBox(width: 6),
            Text(
              '$amount',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 4),
            InkWell(
              onTap: onTopUp,
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: Colors.amber[700],
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.add, size: 14, color: Colors.black),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
