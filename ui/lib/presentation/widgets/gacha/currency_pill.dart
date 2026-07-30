import 'package:flutter/material.dart';

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

  // Map PNG asset paths here
  String get _assetPath {
    switch (type) {
      case CurrencyType.permitTen:
        return 'assets/images/permit_ten.png';
      case CurrencyType.permitOne:
        return 'assets/images/permit_one.png';
      case CurrencyType.originite:
        return 'assets/images/originite.png';
      case CurrencyType.orundum:
        return 'assets/images/orundum.png';
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
              ? Colors.amber[900]!.withOpacity(0.3)
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
            // PNG Icon
            Image.asset(
              _assetPath,
              width: 22,
              height: 22,
              errorBuilder: (_, __, ___) => const Icon(
                Icons.monetization_on,
                size: 20,
                color: Colors.amber,
              ),
            ),
            const SizedBox(width: 6),
            // Currency Balance Value
            Text(
              '$amount',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
            const SizedBox(width: 4),
            // Plus / Top-up Button
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
