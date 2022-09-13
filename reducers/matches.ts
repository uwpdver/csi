import { MatchesInClient } from "@/types/client";
import { Phases } from "@/types/index";
import { Action } from './index';

export type ActionType =
  | "RESET_HAND_CARD_SELECT"
  | "SELECT_HAND_CARD"
  | "START_SELECT_HAND_CARD"
  | "CANCEL_SELECT_HAND_CARD"
  | "UPDATE_MATCHES_STATE";

type SelectFor = "murder" | "solveCase";

export type InitState = {
  matches: MatchesInClient;
  handCardSelect: {
    canSelect: boolean;
    selectFor: SelectFor;
    selectedPlayerIndex: number;
    selectedMeasure: string;
    selectedClue: string;
  };
};

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
});

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
