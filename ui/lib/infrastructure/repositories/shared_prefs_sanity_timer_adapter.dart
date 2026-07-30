import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/repositories/sanity_timer_repository.dart';

class SharedPrefsSanityTimerAdapter implements SanityTimerRepository {
  static const _kTimersKey = 'sanity_timers_data';

  @override
  Future<List<SanityTimer>> getTimers() async {
    final prefs = await SharedPreferences.getInstance();
    final rawList = prefs.getStringList(_kTimersKey) ?? [];

    return rawList.map((item) {
      final Map<String, dynamic> json = jsonDecode(item);
      return SanityTimer.fromJson(json);
    }).toList();
  }

  @override
  Future<void> saveTimer(SanityTimer timer) async {
    final prefs = await SharedPreferences.getInstance();
    final currentTimers = await getTimers();

    final index = currentTimers.indexWhere((t) => t.id == timer.id);
    if (index >= 0) {
      currentTimers[index] = timer;
    } else {
      currentTimers.add(timer);
    }

    final encodedList = currentTimers
        .map((t) => jsonEncode(t.toJson()))
        .toList();
    await prefs.setStringList(_kTimersKey, encodedList);
  }

  @override
  Future<void> deleteTimer(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final currentTimers = await getTimers();

    currentTimers.removeWhere((t) => t.id == id);

    final encodedList = currentTimers
        .map((t) => jsonEncode(t.toJson()))
        .toList();
    await prefs.setStringList(_kTimersKey, encodedList);
  }
}
