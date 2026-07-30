import 'package:ui/domain/entities/local_entities.dart';

abstract class SanityTimerRepository {
  Future<SanityTimer?> getTimer();
  Future<void> saveTimer(SanityTimer timer);
  Future<void> deleteTimer();
}
