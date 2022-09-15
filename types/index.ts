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

type Weight = 1 | 2 | 3 | 4 | 5 | 6;

export interface Option {
  isSetted: boolean;
  weight: Weight;
  put(): void;
}
