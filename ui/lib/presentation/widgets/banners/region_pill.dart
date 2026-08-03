import 'package:flutter/material.dart';

enum ServerRegion { en, cn, jp }

class RegionSelectorPill extends StatelessWidget {
  final ServerRegion selectedRegion;
  final ValueChanged<ServerRegion> onRegionChanged;

  const RegionSelectorPill({
    super.key,
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
