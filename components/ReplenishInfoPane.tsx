import classnames from "classnames";
import { useReducer } from "react";
import {
  Information,
  InformationCard,
  InformationCardsOnMatches,
} from "@prisma/client";
import { default as InformationCardComponent } from "./InformationCard";
import { OptionInClient } from "@/types/client";
import { InformationCardStatus, Role } from "@/types/index";

type InfoCard = InformationCardsOnMatches & {
  informationCard: InformationCard & {
    list: Information[];
  };
};

export interface Props {
  defaultInformationCards: InfoCard[];
  defaultOptions: OptionInClient[];
  isHidden?: boolean;
  isPointOutInfo?: boolean;
  onComfirm(
    informationCards: Omit<InformationCardsOnMatches, "matcheId">[],
    options: OptionInClient[]
  ): void;
  onQuit(informationCards: Omit<InformationCardsOnMatches, "matcheId">[]): void;
  role: string;
}

interface InitState {
  optionsSetted: OptionInClient[];
  optionsNotSet: OptionInClient[];
  curOptionIndex: number;
  informationCards: InfoCard[];
  selectedNewCardIndex: number;
  changedOptions: OptionInClient[];
  changedInfoCards: Omit<InformationCardsOnMatches, "matcheId">[];
  initOptions: OptionInClient[];
  initInformationCards: InfoCard[];
}

const getInitState = ({
  initOptions,
  initInformationCards,
}: {
  initOptions: OptionInClient[];
  initInformationCards: InfoCard[];
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

type ACTION_TYPE =
  | "RESET_ALL"
  | "SWAP_INFO_CARD"
  | "PUT_OPTION_ON_CARD"
  | "SELECT_OPTION"
  | "SELECT_NEW_INFO_CARD";

const reducer = (
  state: InitState,
  action: { type: ACTION_TYPE; [key: string]: any }
) => {
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
      return swapInfoCard(state, action);
    case "PUT_OPTION_ON_CARD":
      return putOptionOnCard(state, action);
    case "SELECT_OPTION":
      return {
        ...state,
        curOptionIndex: action.index,
      };
    case "SELECT_NEW_INFO_CARD":
      const { curOptionIndex } = state;
      const { index } = action;
      return {
        ...state,
        selectedNewCardIndex: index === curOptionIndex ? -1 : index,
      };
    default:
      return state;
  }
};

function swapInfoCard(
  state: InitState,
  action: { type: ACTION_TYPE; [key: string]: any }
): InitState {
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
  const { index } = action;
  const copyCards = [...informationCards];
  const temp = copyCards[index];
  const selectedNewCard = informationCards[selectedNewCardIndex];
  copyCards[index] = {
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
    optionsNotSet: [...optionsNotSet, optionsSetted[index]],
    optionsSetted: [
      ...optionsSetted.slice(0, index),
      {
        weight: 0,
        indexOnCard: -1,
      },
      ...optionsSetted.slice(index + 1),
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

function putOptionOnCard(
  state: InitState,
  action: { type: ACTION_TYPE; [key: string]: any }
) {
  const { index, subIndex } = action;
  const { optionsSetted, optionsNotSet, curOptionIndex, changedOptions } =
    state;
  const optionSetted = optionsSetted[index];
  const optionNotSet = optionsNotSet[curOptionIndex];
  if (optionSetted && optionSetted.weight === 0 && optionNotSet) {
    const newOption = { weight: optionNotSet.weight, indexOnCard: subIndex };
    return {
      ...state,
      curOptionIndex: -1,
      optionsNotSet: optionsNotSet.filter(
        (option, index) => index !== curOptionIndex
      ),
      changedOptions: [...changedOptions, newOption],
      optionsSetted: [
        ...optionsSetted.slice(0, index),
        newOption,
        ...optionsSetted.slice(index + 1),
      ],
    };
  }
  return { ...state };
}

const ReplenishInfoPane = ({
  isHidden,
  defaultOptions,
  defaultInformationCards,
  onComfirm,
  role,
  onQuit,
}: Props) => {
  const initState = getInitState({
    initInformationCards: defaultInformationCards,
    initOptions: defaultOptions,
  });
  const [
    {
      optionsSetted,
      optionsNotSet,
      curOptionIndex,
      informationCards,
      changedOptions,
      changedInfoCards,
    },
    dispatch,
  ] = useReducer(reducer, initState);

  const oldCards = informationCards.slice(2, 6);
  const notShowingCards = informationCards.slice(6);
  const newCards = notShowingCards.filter(
    (card) => card.status === InformationCardStatus.Pending
  );
  const discardedCards = notShowingCards.filter(
    (card) => card.status === InformationCardStatus.Discard
  );
  const optionsSettedShowed = optionsSetted.slice(2, 6);

  const handleClickItem = (index: number, subIndex: number) => {
    if (role !== Role.Witness) return null;
    dispatch({ type: "PUT_OPTION_ON_CARD", index, subIndex });
  };

  const handleConfirmPointOutInformation = () => {
    if (
      optionsSetted.length !== 6 ||
      optionsSetted.some((option) => option.weight === 0)
    ) {
      return;
    }
    onComfirm(changedInfoCards, changedOptions);
  };

  const hanleClickOptionNotSet = (index: number) => {
    dispatch({ type: "SELECT_OPTION", index });
  };

  const handleOldCardClick = (index: number) => {
    dispatch({ type: "SWAP_INFO_CARD", index });
  };

  const handleNewCardClick = (index: number) => {
    if (role !== Role.Witness) return null;
    if (informationCards[index]?.status === InformationCardStatus.Pending) {
      dispatch({ type: "SELECT_NEW_INFO_CARD", index });
    }
  };

  const handleReset = () => {
    dispatch({ type: "RESET_ALL" });
  };

  const handleQuit = () => {
    onQuit(
      newCards.map((card) => ({
        ...card,
        status: InformationCardStatus.Discard,
      }))
    );
  };

  const showingCardsElem = (
    <>
      <div className="mb-2">场上的场景卡</div>
      <ul className="grid grid-cols-4 gap-1 space-x-2 text-center relative">
        {oldCards.map((card, index) => {
          const option = optionsSettedShowed[index];
          return (
            <li className="shrink-0 basis-20" key={index}>
              <InformationCardComponent
                isHidden={isHidden}
                index={card.order - 1}
                option={option}
                status={card.status}
                categoryName={card.informationCard.categoryName}
                list={card.informationCard.list}
                onClickItem={handleClickItem}
                onClick={handleOldCardClick}
              />
            </li>
          );
        })}
      </ul>
    </>
  );

  const optionsNotSetElem = (
    <div className="flex items-center mt-4">
      <ul className="flex flex-1 space-x-2 mx-2">
        {optionsNotSet.map((option, index) => (
          <li
            key={option.weight}
            onClick={hanleClickOptionNotSet.bind(null, index)}
            className={classnames(
              "bg-red-600 border border-black h-10 w-10 rounded-full flex items-center justify-center font-bold text-xl text-white",
              {
                "bg-red-300": curOptionIndex === index,
              }
            )}
          >
            {option.weight}
          </li>
        ))}
      </ul>

      <button
        className="ml-auto mr-0 rounded-full rounded-r-none"
        onClick={handleReset}
      >
        撤销
      </button>
    </div>
  );

  const notShowingCardPaneRender = (
    name: string,
    cards: InfoCard[],
    onCardClick?: (index: number) => void
  ) => {
    if (!cards.length) return null;
    return (
      <div>
        <div className="mt-4 mb-2">{name}</div>
        <ul className="flex flex-nowrap space-x-2 text-center relative">
          {cards.map((card, index) => {
            return (
              <li className="shrink-0 basis-20" key={index}>
                <InformationCardComponent
                  isHidden={isHidden}
                  index={card.order - 1}
                  status={card.status}
                  categoryName={card.informationCard.categoryName}
                  list={card.informationCard.list}
                  onClickItem={handleClickItem}
                  onClick={onCardClick}
                />
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const notShowingCardsElem = (
    <div className="flex space-x-2">
      {notShowingCardPaneRender("新增的场景卡", newCards, handleNewCardClick)}
      {notShowingCardPaneRender("废弃的场景卡", discardedCards)}
    </div>
  );

  const footerElem = (
    <div className="flex space-x-2 mt-8">
      <button className="flex-1" onClick={handleConfirmPointOutInformation}>
        确定
      </button>
      <button className="flex-1" onClick={handleQuit}>
        放弃
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {showingCardsElem}
        {role === Role.Witness && optionsNotSetElem}
        {notShowingCardsElem}
      </div>
      {role === Role.Witness && footerElem}
    </div>
  );
};

export default ReplenishInfoPane;
