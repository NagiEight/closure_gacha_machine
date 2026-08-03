import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:ui/domain/entities/api_entities.dart';
import 'package:ui/domain/ports/gacha_port.dart';

/// Adapter implementing [GachaPort] to interface with Closure's Gacha API.
class ClosureGachaMachineAdapter implements GachaPort {
  final http.Client _client;
  late final String _baseUrl;
  late final String _cloudUrl;

  ClosureGachaMachineAdapter({
    http.Client? client,
    String baseUrl = 'http://localhost:3000',
    String cloudUrl = 'https://nagicloud.uk',
  }) : _client = client ?? http.Client() {
    _baseUrl = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    _cloudUrl = cloudUrl.endsWith('/')
        ? cloudUrl.substring(0, cloudUrl.length - 1)
        : cloudUrl;
  }

  @override
  Future<List<String>> getBannersPage(int page) async {
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/banners/$page'),
    );

    _checkResponseStatus(response);

    final List<dynamic> data = jsonDecode(response.body);
    return data.map((item) => item['Name'] as String).toList();
  }

  @override
  Future<BannerEntity> getBannerDetails(String bannerName) async {
    final encodedName = Uri.encodeComponent(bannerName);
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/banner/$encodedName'),
    );

    _checkResponseStatus(response);

    final Map<String, dynamic> data = jsonDecode(response.body);
    return BannerEntity.fromJson(data);
  }

  @override
  Future<Operator> getOperatorDetails(String operatorId) async {
    final encodedId = Uri.encodeComponent(operatorId);
    final response = await _client.get(
      Uri.parse('$_baseUrl/api/operator/$encodedId'),
    );

    _checkResponseStatus(response);

    final Map<String, dynamic> data = jsonDecode(response.body);
    return Operator.fromJson(data);
  }

  @override
  String getBannerCoverUrl(String bannerName) {
    return '$_cloudUrl/banners/covers/${Uri.encodeComponent('${bannerName.replaceAll(' ', '_')}.png')}';
  }

  @override
  String getOperatorArtUrl(String operatorId) {
    return '$_cloudUrl/operators/e0/${Uri.encodeComponent('$operatorId.png')}';
  }

  @override
  String getOperatorCardUrl(String operatorId) {
    return '$_cloudUrl/operators/cards/${Uri.encodeComponent('$operatorId.png')}';
  }

  @override
  String getOperatorE2ArtUrl(String operatorId) {
    return '$_cloudUrl/operators/e2/${Uri.encodeComponent('$operatorId.png')}';
  }

  @override
  Future<GachaSession> createSession() async {
    final response = await _client.post(Uri.parse('$_baseUrl/gacha/create'));

    _checkResponseStatus(response);

    // Case-insensitive header check
    final sessionToken = response.headers.entries
        .firstWhere(
          (e) => e.key.toLowerCase() == 'session-token',
          orElse: () => const MapEntry('', ''),
        )
        .value;

    if (sessionToken.isEmpty) {
      throw Exception('Session token missing from server response headers.');
    }

    return GachaSession(token: sessionToken);
  }

  @override
  Future<String> rollSingle({
    required String bannerName,
    required String sessionToken,
  }) async {
    final encodedBanner = Uri.encodeComponent(bannerName);
    final response = await _client.post(
      Uri.parse('$_baseUrl/gacha/$encodedBanner/roll'),
      headers: {'Session-Token': sessionToken},
    );

    _checkResponseStatus(response);

    final Map<String, dynamic> data = jsonDecode(response.body);
    return data['Result'] as String;
  }

  @override
  Future<List<String>> rollMultiple({
    required String bannerName,
    required String sessionToken,
    required int count,
  }) async {
    final encodedBanner = Uri.encodeComponent(bannerName);
    final response = await _client.post(
      Uri.parse('$_baseUrl/gacha/$encodedBanner/roll/$count'),
      headers: {'Session-Token': sessionToken},
    );

    _checkResponseStatus(response);

    final Map<String, dynamic> data = jsonDecode(response.body);
    final resultsList = data['Result'] as List<dynamic>?;

    if (resultsList == null) {
      throw Exception(data['Message'] ?? 'Backend returned null result');
    }

    return resultsList.cast<String>();
  }

  @override
  Future<void> deleteSession(String sessionToken) async {
    final request = http.Request('PURGE', Uri.parse('$_baseUrl/gacha/delete/'))
      ..headers['Session-Token'] = sessionToken;

    final streamedResponse = await _client.send(request);
    final response = await http.Response.fromStream(streamedResponse);

    _checkResponseStatus(response);
  }

  void _checkResponseStatus(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return;
    }

    try {
      final Map<String, dynamic> body = jsonDecode(response.body);
      final message =
          body['message'] ??
          'Request failed with status ${response.statusCode}';
      throw Exception(message);
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception(
        'Request failed with status ${response.statusCode}: ${response.body}',
      );
    }
  }
}
