import '../entities/api_entities.dart';

/// Abstract Port definition for Gacha domain operations.
abstract interface class GachaPort {
  /// Fetches a paginated list of banner names (1-indexed).
  Future<List<String>> getBannersPage(int page);

  /// Fetches complete metadata and operator pool for a target banner.
  Future<BannerEntity> getBannerDetails(String bannerName);

  /// Fetches operator metadata by ID.
  Future<OperatorEntity> getOperatorDetails(String operatorId);

  /// Constructs the asset URL for a banner cover image.
  String getBannerCoverUrl(String bannerName);

  /// Constructs the asset URL for an operator's base artwork.
  String getOperatorArtUrl(String operatorId);

  /// Constructs the asset URL for an operator's Elite 2 artwork.
  String getOperatorE2ArtUrl(String operatorId);

  /// Creates a new gacha session profile.
  Future<GachaSession> createSession();

  /// Performs a single roll on a target banner.
  Future<String> rollSingle({
    required String bannerName,
    required String sessionToken,
  });

  /// Performs multiple rolls on a target banner.
  Future<List<String>> rollMultiple({
    required String bannerName,
    required String sessionToken,
    required int count,
  });

  /// Invalidates and deletes an active gacha session.
  Future<void> deleteSession(String sessionToken);
}
