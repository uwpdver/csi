export interface Card {
  id: string;
  name: string;
}

// 信息卡
export interface InformationCard<T = string> extends Card {
  options: T[];
}

// 手段卡
export interface MeasureCard extends Card {
  picture: string;
}

// 线索卡
export interface ClueCard extends Card {
  picture: string;
}

// 手法
export enum Measure {}

// 线索
export enum Clue {}

// 信息
export enum Information {}

// 身份
export enum Role {
  Witness = "Witness",
  Detective = "Detective",
  Accomplice = "Accomplice",
  Murderer = "Murderer",
}

export enum InformationCardStatus {
  Init = 0,
  Pending = 1,
  Show = 2,
  Discard = 3,
}

// 阶段
export enum Phases {
  Init = 0,
  Murder = 1,
  ProvideTestimonials = 2,
  Reasoning = 3,
  Accomplice = 4,
  AdditionalTestimonials = 5,
  DetectiveWin = 6,
  MurdererWin = 7,
}

export enum PlayerStatus {
  NotReady = 0,
  Ready = 1,
  Leave = 2,
}

// 玩家
export interface Player {
  id: string | number;
  name: string;
  role: Role;
}

type Weight = 1 | 2 | 3 | 4 | 5 | 6;

export interface Option {
  isSetted: boolean;
  weight: Weight;
  put(): void;
}

export interface CardPile<T = InformationCard> {
  cards: T[];
}

export interface Witness extends Player {
  role: Role.Witness;
  provideTestimonials(): void;
  additionalTestimonials(): void;
}

export interface Detective extends Player {
  role: Role.Detective;
  remainingNumOfSolveCase: number;
  solveCase(): void;
}

export interface Murderer extends Omit<Detective, "role"> {
  role: Role.Murderer;
  remainingNumOfMurders: number;
  murder(): void;
}

export interface Accomplice extends Omit<Detective, "role"> {
  remainingNumOfHelp: number;
  role: Role.Accomplice;
  help(): void;
}

// 对局
export interface Matches {
  phases: Phases;
  players: Player[];
  infoCards: InformationCard[];
  options: [];
  informationCardPile: InformationCard[];
  measureCardPile: CardPile<MeasureCard>;
}
