// domain/entities/currency.dart
class Currency {
  final int permitTen;
  final int permitOne;
  final int originite;
  final int orundum;

  const Currency({
    this.permitTen = 0,
    this.permitOne = 0,
    this.originite = 0,
    this.orundum = 0,
  });

  Currency copyWith({
    int? permitTen,
    int? permitOne,
    int? originite,
    int? orundum,
  }) {
    return Currency(
      permitTen: permitTen ?? this.permitTen,
      permitOne: permitOne ?? this.permitOne,
      originite: originite ?? this.originite,
      orundum: orundum ?? this.orundum,
    );
  }

  Map<String, dynamic> toJson() => {
    'permitTen': permitTen,
    'permitOne': permitOne,
    'originite': originite,
    'orundum': orundum,
  };

  factory Currency.fromJson(Map<String, dynamic> json) {
    return Currency(
      permitTen: json['permitTen'] as int? ?? 0,
      permitOne: json['permitOne'] as int? ?? 0,
      originite: json['originite'] as int? ?? 0,
      orundum: json['orundum'] as int? ?? 0,
    );
  }
}

// domain/entities/gacha_collection.dart
class GachaCollection {
  final List<String> acquiredOperatorIds;
  final int totalRolls;

  const GachaCollection({
    this.acquiredOperatorIds = const [],
    this.totalRolls = 0,
  });

  GachaCollection copyWith({
    List<String>? acquiredOperatorIds,
    int? totalRolls,
  }) {
    return GachaCollection(
      acquiredOperatorIds: acquiredOperatorIds ?? this.acquiredOperatorIds,
      totalRolls: totalRolls ?? this.totalRolls,
    );
  }

  Map<String, dynamic> toJson() => {
    'acquiredOperatorIds': acquiredOperatorIds,
    'totalRolls': totalRolls,
  };

  factory GachaCollection.fromJson(Map<String, dynamic> json) {
    return GachaCollection(
      acquiredOperatorIds:
          (json['acquiredOperatorIds'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      totalRolls: json['totalRolls'] as int? ?? 0,
    );
  }
}

// domain/entities/sanity_timer.dart
class SanityTimer {
  final String id;
  final String label;
  final int targetSanity;
  final int currentSanity;
  final DateTime createdAt;

  const SanityTimer({
    required this.id,
    required this.label,
    required this.targetSanity,
    required this.currentSanity,
    required this.createdAt,
  });

  SanityTimer copyWith({
    String? id,
    String? label,
    int? targetSanity,
    int? currentSanity,
    DateTime? createdAt,
  }) {
    return SanityTimer(
      id: id ?? this.id,
      label: label ?? this.label,
      targetSanity: targetSanity ?? this.targetSanity,
      currentSanity: currentSanity ?? this.currentSanity,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'label': label,
    'targetSanity': targetSanity,
    'currentSanity': currentSanity,
    'createdAt': createdAt.toIso8601String(),
  };

  factory SanityTimer.fromJson(Map<String, dynamic> json) {
    return SanityTimer(
      id: json['id'] as String? ?? '',
      label: json['label'] as String? ?? 'Sanity Recovery',
      targetSanity: json['targetSanity'] as int? ?? 135,
      currentSanity: json['currentSanity'] as int? ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }
}
