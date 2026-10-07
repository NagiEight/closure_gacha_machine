export interface OperatorSummary {
  id: string;
  name: string;
  rarity: number;
  class: string;
}

export interface OperatorSearchQuery {
  nameQuery?: string;
  rarities?: number[];
  classes?: string[];
  subClasses?: string[];
  factions?: string[];
  races?: string[];
}

export interface OperatorEntity {
  id: string;
  name: string;
  rarity: number;
  class: string;
  subClass: string;
  faction: string;
  race: string;
  gender: string;
  obtainable: boolean;
  position: string;
  tags: string[];
}

export const OperatorEntity = {
  fromJson(json: Record<string, unknown>): OperatorEntity {
    return {
      id: (json["Id"] ?? json["id"] ?? "") as string,
      name: (json["Name"] ?? json["name"] ?? "Unknown Operator") as string,
      rarity: Number(json["Rarity"] ?? json["rarity"] ?? 0),
      class: (json["Class"] ?? json["class"] ?? "") as string,
      subClass: (json["SubClass"] ?? json["subClass"] ?? "") as string,
      faction: (json["Faction"] ?? json["faction"] ?? "") as string,
      race: (json["Race"] ?? json["race"] ?? "") as string,
      gender: (json["Gender"] ?? json["gender"] ?? "") as string,
      obtainable: Boolean(json["Obtainable"] ?? json["obtainable"]),
      position: (json["Position"] ?? json["position"] ?? "") as string,
      tags: ((json["Tags"] ?? json["tags"]) as string[]) ?? [],
    };
  },
};
