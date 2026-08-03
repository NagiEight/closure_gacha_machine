import 'package:flutter/material.dart';

class AnalyticsCard extends StatelessWidget {
  final String title;
  final Widget child;

  const AnalyticsCard({super.key, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.amber,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
              fontFamily: 'monospace',
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
