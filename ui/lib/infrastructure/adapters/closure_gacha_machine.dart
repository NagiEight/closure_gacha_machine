import 'dart:convert';
import 'package:http/http.dart' as http;

import '../../domain/entities/api_entities.dart';
import '../../domain/ports/gacha_port.dart';

/// Adapter implementation connecting domain ports to backend HTTP endpoints
class ClosureGachaMachineAdapter implements GachaPort {
  final http.Client _client;
  final String baseUrl;

  ClosureGachaMachineAdapter({required this.baseUrl, http.Client? client})
    : _client = client ?? http.Client();

  String _extractErrorMessage(String body, String fallback) {
    try {
      final json = jsonDecode(body) as Map<String, dynamic>;
      return json['message'] as String? ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  @override
  Future<List<String>> getBannersPage(int page) async {
    final response = await _client.get(Uri.parse('$baseUrl/api/banners/$page'));

    if (response.statusCode == 200) {
      final List<dynamic> jsonList = jsonDecode(response.body);
      print(jsonList);
      return jsonList.cast<String>();
    }

    throw Exception(
      _extractErrorMessage(response.body, 'Failed to fetch banners page.'),
    );
  }

  @override
  Future<BannerEntity> getBannerDetails(String bannerName) async {
    // Split base URL host/port and construct path segments cleanly
    final baseUri = Uri.parse(baseUrl);
    final uri = baseUri.replace(
      pathSegments: [...baseUri.pathSegments, 'api', 'banner', bannerName],
    );

    final response = await _client.get(uri);

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return BannerEntity.fromJson(json);
    }

    throw Exception(_extractErrorMessage(response.body, 'Banner not found.'));
  }

  @override
  Future<OperatorEntity> getOperatorDetails(String operatorId) async {
    final response = await _client.get(
      Uri.parse('$baseUrl/api/operator/$operatorId'),
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return OperatorEntity.fromJson(json);
    }

    throw Exception(_extractErrorMessage(response.body, 'Operator not found.'));
  }

  @override
  String getBannerCoverUrl(String bannerName) {
    return '$baseUrl/assets/banner/${Uri.encodeComponent(bannerName)}';
  }

  @override
  String getOperatorArtUrl(String operatorId) {
    return '$baseUrl/assets/operator/$operatorId';
  }

  @override
  String getOperatorE2ArtUrl(String operatorId) {
    return '$baseUrl/assets/e2operator/$operatorId';
  }

  @override
  Future<GachaSession> createSession() async {
    final response = await _client.post(Uri.parse('$baseUrl/gacha/create'));

    if (response.statusCode == 200) {
      final token =
          response.headers['session-token'] ??
          response.headers['Session-Token'];
      if (token != null && token.isNotEmpty) {
        return GachaSession(token: token);
      }
      throw Exception(
        'Session creation succeeded but missing Session-Token header.',
      );
    }

    throw Exception(
      _extractErrorMessage(response.body, 'Failed to create session.'),
    );
  }

  @override
  Future<String> rollSingle({
    required String bannerName,
    required String sessionToken,
  }) async {
    final response = await _client.post(
      Uri.parse('$baseUrl/gacha/${Uri.encodeComponent(bannerName)}/roll'),
      headers: {'Session-Token': sessionToken},
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      return json['Result'] as String;
    }

    throw Exception(_extractErrorMessage(response.body, 'Roll failed.'));
  }

  @override
  Future<List<String>> rollMultiple({
    required String bannerName,
    required String sessionToken,
    required int count,
  }) async {
    final response = await _client.post(
      Uri.parse(
        '$baseUrl/gacha/${Uri.encodeComponent(bannerName)}/roll/$count',
      ),
      headers: {'Session-Token': sessionToken},
    );

    if (response.statusCode == 200) {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      final List<dynamic> results = json['Result'] as List<dynamic>;
      return results.cast<String>();
    }

    throw Exception(_extractErrorMessage(response.body, 'Multi-roll failed.'));
  }

  @override
  Future<void> deleteSession(String sessionToken) async {
    final request = http.Request('PURGE', Uri.parse('$baseUrl/gacha/delete/'))
      ..headers['Session-Token'] = sessionToken;

    final streamedResponse = await _client.send(request);
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      return;
    }

    throw Exception(
      _extractErrorMessage(response.body, 'Failed to delete session.'),
    );
  }
}
