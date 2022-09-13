import {
  Matches,
  Player,
  User,
  MeasureCardsOnPlayers,
  MeasureCard,
  ClueCardsOnPlayers,
  ClueCard,
  InformationCardsOnMatches,
  InformationCard,
  Information,
  OptionsOnMatches,
  Option,
} from "@prisma/client";

export interface OptionInClient {
  weight: number;
  indexOnCard: number;
}

export type MatchesInClient = Matches & {
  players: (Player & {
    user: User;
    measureCards: (MeasureCardsOnPlayers & {
      measureCard: MeasureCard;
    })[];
    clueCards: (ClueCardsOnPlayers & {
      clueCard: ClueCard;
    })[];
  })[];
  informationCards: (InformationCardsOnMatches & {
    informationCard: InformationCard & {
      list: Information[];
    };
  })[];
  options: (OptionsOnMatches & {
    option: Option;
  })[];
};


export type InfoCardInClient = InformationCardsOnMatches & {
  informationCard: InformationCard & {
    list: Information[];
  };
};

export type MeasureCardInClient = MeasureCardsOnPlayers & {
  measureCard: MeasureCard;
};

export type ClueCardInClient = ClueCardsOnPlayers & {
  clueCard: ClueCard;
};

export type PlayerInClient = Player & {
  user: User;
  measureCards: MeasureCardInClient[];
  clueCards: ClueCardInClient[];
};