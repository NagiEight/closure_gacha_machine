import 'package:ui/domain/entities/local_entities.dart';

abstract class GachaCollectionRepository {
  Future<GachaCollection> getCollection();
  Future<void> saveCollection(GachaCollection collection);
  Stream<GachaCollection> watchCollection();
}
