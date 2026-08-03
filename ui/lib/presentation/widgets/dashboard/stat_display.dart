import 'package:flutter/material.dart';

class StatDisplay extends StatelessWidget {
  final String label;
  final String value;

  const StatDisplay({super.key, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            fontFamily: 'monospace',
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white38,
            fontSize: 9,
            fontFamily: 'monospace',
          ),
        ),
      ],
    );
  }
}
