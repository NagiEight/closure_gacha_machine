import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/repositories/sanity_timer_repository.dart';

class SharedPreferencesSanityTimerRepository implements SanityTimerRepository {
  static const String _storageKey = 'sanity_timer_data';
  final SharedPreferences _prefs;

  SharedPreferencesSanityTimerRepository(this._prefs);

  @override
  Future<SanityTimer?> getTimer() async {
    final rawJson = _prefs.getString(_storageKey);
    if (rawJson == null) return null;

    try {
      final Map<String, dynamic> jsonMap = jsonDecode(rawJson);
      final storedTimer = SanityTimer.fromJson(jsonMap);

      // Dynamically recalculate recovered sanity based on elapsed time
      final now = DateTime.now();
      final elapsedMinutes = now.difference(storedTimer.createdAt).inMinutes;
      final recoveredSanity = elapsedMinutes ~/ 6;

      if (recoveredSanity <= 0) {
        return storedTimer;
      }

      final updatedSanity = (storedTimer.currentSanity + recoveredSanity).clamp(
        0,
        storedTimer.targetSanity,
      );

      return storedTimer.copyWith(
        currentSanity: updatedSanity,
        createdAt: storedTimer.createdAt.add(
          Duration(minutes: recoveredSanity * 6),
        ),
      );
    } catch (_) {
      return null;
    }
  }

  @override
  Future<void> saveTimer(SanityTimer timer) async {
    final rawJson = jsonEncode(timer.toJson());
    await _prefs.setString(_storageKey, rawJson);
  }

  @override
  Future<void> deleteTimer() async {
    await _prefs.remove(_storageKey);
  }
}
