import 'package:flutter/material.dart';

enum HistorySortOption { newest, oldest, nameAsc, nameDesc, onlyNew }

class HistorySortSheet extends StatelessWidget {
  final HistorySortOption selectedSort;
  final ValueChanged<HistorySortOption> onSelect;

  const HistorySortSheet({
    super.key,
    required this.selectedSort,
    required this.onSelect,
  });

  static Future<HistorySortOption?> show(
    BuildContext context,
    HistorySortOption currentSort,
  ) {
    return showModalBottomSheet<HistorySortOption>(
      context: context,
      backgroundColor: const Color(0xFF1E1E1E),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => HistorySortSheet(
        selectedSort: currentSort,
        onSelect: (option) => Navigator.of(context).pop(option),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(
                'SORT & FILTER LOGS',
                style: TextStyle(
                  color: Colors.amber,
                  fontFamily: 'monospace',
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
            ),
            const Divider(color: Colors.white12),
            _buildTile('Newest First', HistorySortOption.newest),
            _buildTile('Oldest First', HistorySortOption.oldest),
            _buildTile('Operator Name (A-Z)', HistorySortOption.nameAsc),
            _buildTile('Operator Name (Z-A)', HistorySortOption.nameDesc),
            _buildTile('Only "NEW" Acquisitions', HistorySortOption.onlyNew),
          ],
        ),
      ),
    );
  }

  Widget _buildTile(String label, HistorySortOption option) {
    final isSelected = selectedSort == option;
    return ListTile(
      title: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.amber : Colors.white70,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      trailing: isSelected
          ? const Icon(Icons.check_rounded, color: Colors.amber)
          : null,
      onTap: () => onSelect(option),
    );
  }
}
