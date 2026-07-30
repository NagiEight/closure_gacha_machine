import 'package:flutter/material.dart';
import 'package:ui/presentation/widgets/gacha/currency_pill.dart';

class CurrencySelector extends StatelessWidget {
  final CurrencyType selectedCurrency;
  final bool isLoading;
  final int Function(CurrencyType) getAmount;
  final ValueChanged<CurrencyType> onSelect;
  final ValueChanged<CurrencyType> onTopUp;

  const CurrencySelector({
    super.key,
    required this.selectedCurrency,
    required this.isLoading,
    required this.getAmount,
    required this.onSelect,
    required this.onTopUp,
  });

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const SizedBox(
        height: 48,
        child: Center(
          child: SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              color: Colors.amber,
              strokeWidth: 2,
            ),
          ),
        ),
      );
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: CurrencyType.values.map((type) {
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: CurrencyPill(
              type: type,
              amount: getAmount(type),
              isSelected: selectedCurrency == type,
              onTap: () => onSelect(type),
              onTopUp: () => onTopUp(type),
            ),
          );
        }).toList(),
      ),
    );
  }
}
