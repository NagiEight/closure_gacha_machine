import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:ui/presentation/widgets/main_nav_bar.dart';

void main() {
  group('MainNavBar Widget', () {
    testWidgets('renders all navigation items correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            bottomNavigationBar: MainNavBar(
              currentIndex: 2,
              onTap: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('Timer'), findsOneWidget);
      expect(find.text('History'), findsOneWidget);
      expect(find.text('GACHA'), findsOneWidget);
      expect(find.text('Dashboard'), findsOneWidget);
      expect(find.text('Settings'), findsOneWidget);
    });

    testWidgets('triggers onTap callback with correct index when tapped', (WidgetTester tester) async {
      int tappedIndex = -1;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            bottomNavigationBar: MainNavBar(
              currentIndex: 2,
              onTap: (index) {
                tappedIndex = index;
              },
            ),
          ),
        ),
      );

      // Tap Timer (Index 0)
      await tester.tap(find.text('Timer'));
      await tester.pumpAndSettle();
      expect(tappedIndex, equals(0));

      // Tap History (Index 1)
      await tester.tap(find.text('History'));
      await tester.pumpAndSettle();
      expect(tappedIndex, equals(1));

      // Tap GACHA center button (Index 2)
      await tester.tap(find.text('GACHA'));
      await tester.pumpAndSettle();
      expect(tappedIndex, equals(2));

      // Tap Dashboard (Index 3)
      await tester.tap(find.text('Dashboard'));
      await tester.pumpAndSettle();
      expect(tappedIndex, equals(3));

      // Tap Settings (Index 4)
      await tester.tap(find.text('Settings'));
      await tester.pumpAndSettle();
      expect(tappedIndex, equals(4));
    });
  });
}
