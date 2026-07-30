import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ui/domain/entities/local_entities.dart';
import 'package:ui/domain/repositories/gacha_collection_repository.dart';

class SharedPrefsGachaCollectionAdapter implements GachaCollectionRepository {
  static const _kCollectionKey = 'gacha_collection_data';

  @override
  Future<GachaCollection> getCollection() async {
    final prefs = await SharedPreferences.getInstance();
    final rawJson = prefs.getString(_kCollectionKey);
    if (rawJson == null) return const GachaCollection();

    try {
      final Map<String, dynamic> decoded = jsonDecode(rawJson);
      return GachaCollection.fromJson(decoded);
    } catch (_) {
      return const GachaCollection();
    }
  }

  @override
  Future<void> saveCollection(GachaCollection collection) async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = jsonEncode(collection.toJson());
    await prefs.setString(_kCollectionKey, encoded);
  }
}
