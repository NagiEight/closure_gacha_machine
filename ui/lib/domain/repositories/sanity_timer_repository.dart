import 'package:ui/domain/entities/local_entities.dart';

abstract class SanityTimerRepository {
  Future<List<SanityTimer>> getTimers();
  Future<void> saveTimer(SanityTimer timer);
  Future<void> deleteTimer(String id);
}
