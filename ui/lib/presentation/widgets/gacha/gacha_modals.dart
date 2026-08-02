import 'package:flutter/material.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';
import 'package:ui/presentation/widgets/gacha/currency_pill.dart';

class TopUpModal extends StatefulWidget {
  final CurrencyType currencyType;
  final ValueChanged<int> onConfirm;

  const TopUpModal({
    super.key,
    required this.currencyType,
    required this.onConfirm,
  });

  static Future<void> show(
    BuildContext context,
    CurrencyType type,
    ValueChanged<int> onConfirm,
  ) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E1E1E),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => TopUpModal(currencyType: type, onConfirm: onConfirm),
    );
  }

  @override
  State<TopUpModal> createState() => _TopUpModalState();
}

class _TopUpModalState extends State<TopUpModal> {
  final _controller = TextEditingController(text: '10');

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Top Up ${widget.currencyType.name}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            keyboardType: TextInputType.number,
            autofocus: true,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Amount to add',
              labelStyle: const TextStyle(color: Colors.white54),
              enabledBorder: OutlineInputBorder(
                borderSide: const BorderSide(color: Colors.white24),
                borderRadius: BorderRadius.circular(8),
              ),
              focusedBorder: OutlineInputBorder(
                borderSide: const BorderSide(color: Colors.amber),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber[600],
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: () {
                final amount = int.tryParse(_controller.text) ?? 0;
                Navigator.pop(context);
                if (amount > 0) widget.onConfirm(amount);
              },
              child: const Text(
                'Confirm Top-Up',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class CustomRollModal extends StatefulWidget {
  final ValueChanged<int> onConfirm;

  const CustomRollModal({super.key, required this.onConfirm});

  static Future<void> show(BuildContext context, ValueChanged<int> onConfirm) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF1E1E1E),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => CustomRollModal(onConfirm: onConfirm),
    );
  }

  @override
  State<CustomRollModal> createState() => _CustomRollModalState();
}

class _CustomRollModalState extends State<CustomRollModal> {
  final _controller = TextEditingController(text: '10');

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Custom Headhunt Count',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _controller,
            keyboardType: TextInputType.number,
            autofocus: true,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              labelText: 'Amount of rolls',
              labelStyle: const TextStyle(color: Colors.white54),
              enabledBorder: OutlineInputBorder(
                borderSide: const BorderSide(color: Colors.white24),
                borderRadius: BorderRadius.circular(8),
              ),
              focusedBorder: OutlineInputBorder(
                borderSide: const BorderSide(color: Colors.amber),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber[600],
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onPressed: () {
                final count = int.tryParse(_controller.text) ?? 0;
                Navigator.pop(context);
                if (count > 0) widget.onConfirm(count);
              },
              child: const Text(
                'Execute Headhunt',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
