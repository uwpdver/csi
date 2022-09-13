import { InfoCardInClient, OptionInClient } from "@/types/client";
import { InformationCardsOnMatches } from "@prisma/client";
import { InformationCardStatus } from "../types";
import { Action } from "./index";
import { createOption, isEmptyOption } from "@/utils/option";

export interface InitState {
  optionsSetted: OptionInClient[];
  optionsNotSet: OptionInClient[];
  curOptionIndex: number;
  informationCards: InfoCardInClient[];
  selectedNewCardIndex: number;
  changedOptions: OptionInClient[];
  changedInfoCards: Omit<InformationCardsOnMatches, "matcheId">[];
  initOptions: OptionInClient[];
  initInformationCards: InfoCardInClient[];
}

export const getInitState = ({
  initOptions,
  initInformationCards,
}: {
  initOptions: OptionInClient[];
  initInformationCards: InfoCardInClient[];
}): InitState => ({
  initOptions,
  initInformationCards,
  optionsSetted: initOptions,
  optionsNotSet: [],
  curOptionIndex: -1,
  informationCards: initInformationCards,
  selectedNewCardIndex: -1,
  changedOptions: [],
  changedInfoCards: [],
});

type SwapInfoCardAction = Action<"SWAP_INFO_CARD", { orginIndex: number }>;

function swapInfoCard(state: InitState, action: SwapInfoCardAction): InitState {
  const {
    selectedNewCardIndex,
    informationCards,
    changedInfoCards,
    optionsNotSet,
    optionsSetted,
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
  const { optionsSetted, optionsNotSet, curOptionIndex, changedOptions } =
    state;
  const optionSetted = optionsSetted[orginIndex];
  const optionNotSet = optionsNotSet[curOptionIndex];
  if (optionSetted && isEmptyOption(optionSetted) && optionNotSet) {
    const newOption = createOption(optionNotSet.weight, subIndex);
    return {
      ...state,
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
    };
  }
  return { ...state };
}

export type ACTION_TYPE =
  | "RESET_ALL"
  | "SWAP_INFO_CARD"
  | "PUT_OPTION_ON_CARD"
  | "SELECT_OPTION"
  | "SELECT_NEW_INFO_CARD"
  | "UPDATE_INFORMATION_CARDS"
  | "UPDATE_OPTIONS";

export const reducer = (state: InitState, action: Action<ACTION_TYPE>) => {
  switch (action.type) {
    case "RESET_ALL":
      return {
        ...state,
        optionsSetted: state.initOptions,
        optionsNotSet: [],
        curOptionIndex: -1,
        informationCards: state.initInformationCards,
        selectedNewCardIndex: -1,
        changedOptions: [],
        changedInfoCards: [],
      };
    case "SWAP_INFO_CARD":
      return swapInfoCard(state, action as SwapInfoCardAction);
    case "PUT_OPTION_ON_CARD":
      return putOptionOnCard(state, action as PutOptionOnCardAction);
    case "SELECT_OPTION":
      return {
        ...state,
        curOptionIndex: action.index,
      };
    case "SELECT_NEW_INFO_CARD":
      const { curOptionIndex } = state;
      const { orginIndex } = action;
      return {
        ...state,
        selectedNewCardIndex: orginIndex === curOptionIndex ? -1 : orginIndex,
      };
    case "UPDATE_INFORMATION_CARDS":
      const { infoCards } = action as Action<
        "UPDATE_INFORMATION_CARDS",
        { infoCards: InfoCardInClient[] }
      >;
      return {
        ...state,
        initInformationCards: infoCards,
        informationCards: infoCards,
      };
    case "UPDATE_OPTIONS":
      const { options } = action as Action<
        "UPDATE_OPTIONS",
        { options: OptionInClient[] }
      >;
      return {
        ...state,
        initOptions: options,
        optionsSetted: options,
      };
    default:
      return state;
  }
};
