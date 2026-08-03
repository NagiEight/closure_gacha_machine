import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:ui/infrastructure/adapters/closure_gacha_machine.dart';

void main() {
  group('ClosureGachaMachineAdapter', () {
    test('getBannersPage returns banner names on 200 OK', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.path, equals('/api/banners/1'));
        return http.Response(
          jsonEncode([
            {'Name': 'Banner 1'},
            {'Name': 'Banner 2'}
          ]),
          200,
        );
      });

      final adapter = ClosureGachaMachineAdapter(client: mockClient);
      final banners = await adapter.getBannersPage(1);

      expect(banners, equals(['Banner 1', 'Banner 2']));
    });

    test('getBannersPage throws exception on non-200 status', () async {
      final mockClient = MockClient((request) async {
        return http.Response(jsonEncode({'message': 'Server Error'}), 500);
      });

      final adapter = ClosureGachaMachineAdapter(client: mockClient);

      expect(
        () => adapter.getBannersPage(1),
        throwsA(isA<Exception>()),
      );
    });

    test('createSession extracts Session-Token from response headers', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.path, equals('/gacha/create'));
        return http.Response(
          'OK',
          200,
          headers: {'Session-Token': 'test_token_abc'},
        );
      });

      final adapter = ClosureGachaMachineAdapter(client: mockClient);
      final session = await adapter.createSession();

      expect(session.token, equals('test_token_abc'));
    });

    test('rollSingle posts with Session-Token and returns Result', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.path, equals('/gacha/MyBanner/roll'));
        expect(request.headers['Session-Token'], equals('token_123'));
        return http.Response(jsonEncode({'Result': 'char_101_chen2'}), 200);
      });

      final adapter = ClosureGachaMachineAdapter(client: mockClient);
      final result = await adapter.rollSingle(
        bannerName: 'MyBanner',
        sessionToken: 'token_123',
      );

      expect(result, equals('char_101_chen2'));
    });

    test('rollMultiple posts count and returns List<String> Result', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.path, equals('/gacha/MyBanner/roll/10'));
        expect(request.headers['Session-Token'], equals('token_123'));
        return http.Response(
          jsonEncode({
            'Result': ['op1', 'op2', 'op3']
          }),
          200,
        );
      });

      final adapter = ClosureGachaMachineAdapter(client: mockClient);
      final results = await adapter.rollMultiple(
        bannerName: 'MyBanner',
        sessionToken: 'token_123',
        count: 10,
      );

      expect(results, equals(['op1', 'op2', 'op3']));
    });

    test('getOperatorArtUrl generates correct asset URL', () {
      final adapter = ClosureGachaMachineAdapter(
        cloudUrl: 'https://cdn.example.com',
      );

      final url = adapter.getOperatorArtUrl('char_101_chen2');
      expect(url, equals('https://cdn.example.com/operators/e0/char_101_chen2.png'));
    });
  });
}
