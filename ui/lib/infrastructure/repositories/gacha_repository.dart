import 'dart:convert';
import 'package:hive/hive.dart';
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';

class HiveGachaRepository implements GachaPort {
  final GachaPort _remoteAdapter;
  late final Box<String> _operatorBox;
  late final Box<String> _bannerBox;

  HiveGachaRepository(
    this._remoteAdapter, {
    required Box<String> operatorBox,
    required Box<String> bannerBox,
  }) : _operatorBox = operatorBox,
       _bannerBox = bannerBox;

  @override
  Future<Operator> getOperatorDetails(String operatorId) async {
    if (_operatorBox.containsKey(operatorId)) {
      final jsonString = _operatorBox.get(operatorId)!;
      return Operator.fromJson(jsonDecode(jsonString));
    }

    final operatorData = await _remoteAdapter.getOperatorDetails(operatorId);
    await _operatorBox.put(operatorId, jsonEncode(operatorData.toJson()));
    return operatorData;
  }

  @override
  Future<BannerEntity> getBannerDetails(String bannerName) async {
    if (_bannerBox.containsKey(bannerName)) {
      final jsonString = _bannerBox.get(bannerName)!;
      return BannerEntity.fromJson(jsonDecode(jsonString));
    }

    final bannerData = await _remoteAdapter.getBannerDetails(bannerName);
    await _bannerBox.put(bannerName, jsonEncode(bannerData.toJson()));
    return bannerData;
  }

  @override
  Future<List<String>> getBannersPage(int page) =>
      _remoteAdapter.getBannersPage(page);

  @override
  String getBannerCoverUrl(String bannerName) =>
      _remoteAdapter.getBannerCoverUrl(bannerName);

  @override
  String getOperatorArtUrl(String operatorId) =>
      _remoteAdapter.getOperatorArtUrl(operatorId);

  @override
  String getOperatorCardUrl(String operatorId) =>
      _remoteAdapter.getOperatorCardUrl(operatorId);

  @override
  String getOperatorE2ArtUrl(String operatorId) =>
      _remoteAdapter.getOperatorE2ArtUrl(operatorId);

  @override
  Future<GachaSession> createSession() => _remoteAdapter.createSession();

  @override
  Future<String> rollSingle({
    required String bannerName,
    required String sessionToken,
  }) => _remoteAdapter.rollSingle(
    bannerName: bannerName,
    sessionToken: sessionToken,
  );

  @override
  Future<List<String>> rollMultiple({
    required String bannerName,
    required String sessionToken,
    required int count,
  }) => _remoteAdapter.rollMultiple(
    bannerName: bannerName,
    sessionToken: sessionToken,
    count: count,
  );

  @override
  Future<void> deleteSession(String sessionToken) =>
      _remoteAdapter.deleteSession(sessionToken);
}
