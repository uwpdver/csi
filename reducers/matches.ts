import {
  MatchesInClient,
  InfoCardInClient,
  OptionInClient,
} from "@/types/client";
import { InformationCardsOnMatches } from "@prisma/client";
import { InformationCardStatus } from "../types";
import { Phases } from "@/types/index";
import { Action } from "./index";
import {
  createEmptyOptions,
  createOption,
  isEmptyOption,
} from "@/utils/option";

export type ActionType =
  | "RESET_HAND_CARD_SELECT"
  | "SELECT_HAND_CARD"
  | "START_SELECT_HAND_CARD"
  | "CANCEL_SELECT_HAND_CARD"
  | "UPDATE_MATCHES_STATE"
  // 补充信息卡
  | "RESET_ALL"
  | "SWAP_INFO_CARD"
  | "PUT_OPTION_ON_CARD"
  | "SELECT_OPTION"
  | "SELECT_NEW_INFO_CARD"
  | "SYNC_REPLENISH_INFO"
  // 首次指示信息
  | "POINT_OUT_INFO_PUT_OPTION_ON_CARD"
  | "POINT_OUT_INFO_SELECT_OPTION"
  | "POINT_OUT_INFO_SYNC";

type SelectFor = "murder" | "solveCase";

export interface PointOutInfoState {
  optionsSetted: OptionInClient[];
  optionsNotSet: OptionInClient[];
  curOptionIndex: number;
}

export interface ReplenishPaneState {
  optionsSetted: OptionInClient[];
  optionsNotSet: OptionInClient[];
  curOptionIndex: number;
  informationCards: InfoCardInClient[];
  selectedNewCardIndex: number;
  changedOptions: OptionInClient[];
  changedInfoCards: Omit<InformationCardsOnMatches, "matcheId">[];
}

export type InitState = {
  matches: MatchesInClient;
  handCardSelect: {
    canSelect: boolean;
    selectFor: SelectFor;
    selectedPlayerIndex: number;
    selectedMeasure: string;
    selectedClue: string;
  };
  replenishPane: ReplenishPaneState;
  pointOutInfo: PointOutInfoState;
};

export const getInitReplenishPaneState = ({
  optionsSetted,
  informationCards,
}: {
  optionsSetted: OptionInClient[];
  informationCards: InfoCardInClient[];
}): ReplenishPaneState => ({
  optionsSetted,
  optionsNotSet: [],
  curOptionIndex: -1,
  informationCards,
  selectedNewCardIndex: -1,
  changedOptions: [],
  changedInfoCards: [],
});

export const getInitPointOutInfoState = ({
  initOptions,
}: {
  initOptions: OptionInClient[];
}): PointOutInfoState => ({
  optionsSetted: initOptions.length === 0 ? createEmptyOptions(6) : initOptions,
  optionsNotSet: createEmptyOptions(6),
  curOptionIndex: -1,
});

export const initState = {
  matches: {
    players: [],
    informationCards: [],
    options: [],
    id: -1,
    phases: Phases.Init,
    rounds: 1,
    currentPlayerIndex: -1,
    measure: null,
    clue: null,
    roomId: -1,
  },
  handCardSelect: {
    canSelect: false,
    selectFor: "solveCase",
    selectedPlayerIndex: -1,
    selectedMeasure: "",
    selectedClue: "",
  },
};

type SelectHandCardAction = Action<
  "SELECT_HAND_CARD",
  {
    playerId: number;
    playerIndex: number;
    selectPlayerId: number | null;
    handCardType: "measure" | "clue";
    handCardContent: string;
  }
>;

export const getInitState = (matches: MatchesInClient) => ({
  ...initState,
  matches,
  replenishPane: getInitReplenishPaneState({
    informationCards: matches.informationCards,
    optionsSetted: matches.options.map((option) =>
      createOption(option.optionWeight, option.indexOnCard)
    ),
  }),
  pointOutInfo: getInitPointOutInfoState({
    initOptions: matches.options.map((option) =>
      createOption(option.optionWeight, option.indexOnCard)
    ),
  }),
});

type SwapInfoCardAction = Action<"SWAP_INFO_CARD", { orginIndex: number }>;

function swapInfoCard(state: InitState, action: SwapInfoCardAction): InitState {
  const {
    replenishPane: {
      selectedNewCardIndex,
      informationCards,
      changedInfoCards,
      optionsNotSet,
      optionsSetted,
    },
  } = state;
  if (selectedNewCardIndex === -1) {
    return { ...state };
  }
  const { orginIndex } = action;
  const copyCards = [...informationCards];
  const temp = copyCards[orginIndex];
  const selectedNewCard = informationCards[selectedNewCardIndex];
  copyCards[orginIndex] = {
    ...selectedNewCard,
    order: temp.order,
    status: InformationCardStatus.Show,
  };
  copyCards[selectedNewCardIndex] = {
    ...temp,
    order: selectedNewCard.order,
    status: InformationCardStatus.Discard,
  };
  return {
    ...state,
    replenishPane: {
      ...state.replenishPane,
      optionsNotSet: [...optionsNotSet, optionsSetted[orginIndex]],
      optionsSetted: [
        ...optionsSetted.slice(0, orginIndex),
        createOption(),
        ...optionsSetted.slice(orginIndex + 1),
      ],
      selectedNewCardIndex: -1,
      informationCards: copyCards,
      changedInfoCards: [
        ...changedInfoCards,
        {
          informationCardId: temp.informationCardId,
          order: selectedNewCard.order,
          status: InformationCardStatus.Discard,
        },
        {
          informationCardId: selectedNewCard.informationCardId,
          order: temp.order,
          status: InformationCardStatus.Show,
        },
      ],
    },
  };
}

type PutOptionOnCardAction = Action<
  "PUT_OPTION_ON_CARD",
  {
    orginIndex: number;
    subIndex: number;
  }
>;

function putOptionOnCard(state: InitState, action: PutOptionOnCardAction) {
  const { orginIndex, subIndex } = action;
  const {
    replenishPane: {
      optionsSetted,
      optionsNotSet,
      curOptionIndex,
      changedOptions,
    },
  } = state;
  const optionSetted = optionsSetted[orginIndex];
  const optionNotSet = optionsNotSet[curOptionIndex];
  if (optionSetted && isEmptyOption(optionSetted) && optionNotSet) {
    const newOption = createOption(optionNotSet.weight, subIndex);
    return {
      ...state,
      replenishPane: {
        ...state.replenishPane,
        curOptionIndex: -1,
        optionsNotSet: optionsNotSet.filter(
          (option, index) => index !== curOptionIndex
        ),
        changedOptions: [...changedOptions, newOption],
        optionsSetted: [
          ...optionsSetted.slice(0, orginIndex),
          newOption,
          ...optionsSetted.slice(orginIndex + 1),
        ],
      },
    };
  }
  return { ...state };
}

function pointOutPutOptionOnCard(
  state: InitState,
  action: PutOptionOnCardAction
) {
  const { orginIndex, subIndex } = action;
  const {
    pointOutInfo: { optionsSetted, optionsNotSet, curOptionIndex },
  } = state;
  const optionSetted = optionsSetted[orginIndex];
  const optionNotSet = optionsNotSet[curOptionIndex];
  const copyOptionsSetted = [...optionsSetted];
  const copyOptionsNotSet = [...optionsNotSet];
  copyOptionsSetted[orginIndex] = optionNotSet
    ? createOption(optionNotSet.weight, subIndex)
    : createOption();
  if (optionNotSet) copyOptionsNotSet.splice(curOptionIndex, 1);
  if (!isEmptyOption(optionSetted)) {
    copyOptionsNotSet.push(createOption(optionSetted.weight));
  }
  return {
    ...state,
    pointOutInfo: {
      ...state.pointOutInfo,
      optionsNotSet: copyOptionsNotSet,
      optionsSetted: copyOptionsSetted,
      curOptionIndex: -1,
    },
  };
}

export const reducer = (state: InitState, action: Action<ActionType>) => {
  switch (action.type) {
    case "RESET_HAND_CARD_SELECT":
      return {
        ...state,
        handCardSelect: { ...initState.handCardSelect },
      };
    case "START_SELECT_HAND_CARD":
      return {
        ...state,
        handCardSelect: {
          ...state.handCardSelect,
          canSelect: true,
          selectFor: action.selectFor,
        },
      };
    case "SELECT_HAND_CARD":
      return selectHandCard(state, action as SelectHandCardAction);
    case "UPDATE_MATCHES_STATE":
      return {
        ...state,
        matches: action.payload as MatchesInClient,
      };
    case "RESET_ALL":
      return {
        ...state,
        replenishPane: getInitReplenishPaneState({
          informationCards: state.matches.informationCards,
          optionsSetted: state.matches.options.map((option) =>
            createOption(option.optionWeight, option.indexOnCard)
          ),
        }),
      };
    case "SWAP_INFO_CARD":
      return swapInfoCard(state, action as SwapInfoCardAction);
    case "PUT_OPTION_ON_CARD":
      return putOptionOnCard(state, action as PutOptionOnCardAction);
    case "SELECT_OPTION":
      return {
        ...state,
        replenishPane: {
          ...state.replenishPane,
          curOptionIndex: action.index,
        },
      };
    case "SELECT_NEW_INFO_CARD":
      const {
        replenishPane: { curOptionIndex },
      } = state;
      const { orginIndex } = action;
      return {
        ...state,
        replenishPane: {
          ...state.replenishPane,
          selectedNewCardIndex: orginIndex === curOptionIndex ? -1 : orginIndex,
        },
      };
    case "SYNC_REPLENISH_INFO":
      return {
        ...state,
        replenishPane: {
          ...state.replenishPane,
          informationCards: state.matches.informationCards,
          optionsSetted: state.matches.options.map((option) =>
            createOption(option.optionWeight, option.indexOnCard)
          ),
          optionsNotSet: [],
        },
      };
    case "POINT_OUT_INFO_PUT_OPTION_ON_CARD":
      return pointOutPutOptionOnCard(state, action as PutOptionOnCardAction);
    case "POINT_OUT_INFO_SELECT_OPTION":
      return {
        ...state,
        pointOutInfo: {
          ...state.pointOutInfo,
          curOptionIndex: action.index,
        },
      };
    case "POINT_OUT_INFO_SYNC":
      return {
        ...state,
        pointOutInfo: {
          ...state.pointOutInfo,
          optionsSetted: state.matches.options.map((option) =>
            createOption(option.optionWeight, option.indexOnCard)
          ),
          curOptionIndex: -1,
          optionsNotSet: [],
        },
      };
    default:
      return state;
  }
};

function selectHandCard(state: InitState, action: SelectHandCardAction) {
  const {
    handCardSelect: { selectedMeasure, selectedClue },
  } = state;
  const {
    playerId,
    playerIndex,
    selectPlayerId,
    handCardType,
    handCardContent,
  } = action;

  const nextState = { ...state };
  nextState.handCardSelect.selectedPlayerIndex = playerIndex;
  const isPlayerChanged = playerId !== selectPlayerId;

  if (handCardType === "measure") {
    nextState.handCardSelect.selectedMeasure =
      selectedMeasure === handCardContent ? "" : handCardContent;
    if (isPlayerChanged) {
      nextState.handCardSelect.selectedClue = "";
    }
  } else {
    nextState.handCardSelect.selectedClue =
      selectedClue === handCardContent ? "" : handCardContent;
    if (isPlayerChanged) {
      nextState.handCardSelect.selectedMeasure = "";
    }
  }

  return nextState;
}
