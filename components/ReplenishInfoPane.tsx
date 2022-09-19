import React, { useMemo, useCallback } from "react";
import { InfoCardInClient } from "@/types/client";
import classnames from "classnames";
import { InformationCardStatus, Role } from "@/types/index";
import { default as InformationCardComponent } from "./InformationCard";
import { useDispatch, useSelector } from "pages/matches/[...id]";
import { isEmptyOption } from "@/utils/option";


const ReplenishInfoPane = () => {
  const optionsSetted = useSelector((state) => state.replenishPane.optionsSetted);
  const informationCards = useSelector((state) => state.replenishPane.informationCards);
  const selectedNewCardIndex = useSelector((state) => state.replenishPane.selectedNewCardIndex);
  const self = useSelector(state => state.computed.self);
  const dispatch = useDispatch();

  const [showingCards, newCards, discardedCards] = useMemo(() => {
    const showingCards = informationCards.slice(2, 6);
    const newCards: InfoCardInClient[] = [];
    const discardedCards: InfoCardInClient[] = [];
    informationCards.slice(6).forEach((card) => {
      if (card.status === InformationCardStatus.Pending) {
        newCards.push(card);
      } else if (card.status === InformationCardStatus.Discard) {
        discardedCards.push(card);
      }
    });
    return [showingCards, newCards, discardedCards];
  }, [informationCards]);

  const optionsSettedShowed = optionsSetted.slice(2, 6);
  const isWitness = self?.role === Role.Witness;

  const cardItemRender = useCallback(
    (card: InfoCardInClient, index: number) => {
      const handleCardClick = (orginIndex: number) => {
        if (!isWitness) return null;
        if (card.status === InformationCardStatus.Show) {
          dispatch({ type: "SWAP_INFO_CARD", orginIndex });
        } else if (card.status === InformationCardStatus.Pending) {
          dispatch({ type: "SELECT_NEW_INFO_CARD", orginIndex });
        }
      };

      const handleClickItem = (orginIndex: number, subIndex: number) => {
        if (!isWitness) return null;
        if (card.status !== InformationCardStatus.Show) return null;
        dispatch({
          type: "PUT_OPTION_ON_CARD",
          orginIndex,
          subIndex,
        });
      };

      const option =
        card.status === InformationCardStatus.Show
          ? optionsSettedShowed[index]
          : undefined;

      return (
        <li className="shrink-0 basis-24" key={index}>
          <InformationCardComponent
            card={card}
            option={option}
            className={classnames({
              "-translate-y-2":
                card.status === InformationCardStatus.Pending &&
                selectedNewCardIndex === card.order - 1,
              "translate-y-2":
                (card.status === InformationCardStatus.Show &&
                  selectedNewCardIndex !== -1) ||
                (card.status === InformationCardStatus.Show &&
                  isEmptyOption(option)),
              "grayscale-[.8]": card.status === InformationCardStatus.Discard,
            })}
            onClickItem={handleClickItem}
            onClick={handleCardClick}
          />
        </li>
      );
    },
    [optionsSettedShowed, isWitness, selectedNewCardIndex]
  );

  const notShowingCardPaneRender = (
    name: string,
    cards: InfoCardInClient[],
    id = ""
  ) => {
    if (!cards.length) return null;
    return (
      <div>
        <div className="mt-4 mb-2">{name}</div>
        <ul
          data-intro-id={id}
          className="flex flex-nowrap space-x-2 text-center relative"
        >
          {cards.map(cardItemRender)}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <header></header>
      <header className="text-center mx-4 mb-2 truncate overflow-hidden">
        目击证人正在补充证词
      </header>
      <div className="flex-1">
        {/* 场上的场景卡 */}
        <ul
          data-intro-id="replaceable-info-cards-container"
          className="flex flex-nowrap overflow-x-scroll text-center relative space-x-2 pb-2"
        >
          {showingCards.map(cardItemRender)}
        </ul>
        {/* 其他卡片 */}
        <div className="flex space-x-2">
          {notShowingCardPaneRender(
            "新增的场景卡",
            newCards,
            "new-info-cards-container"
          )}
          {notShowingCardPaneRender("废弃的场景卡", discardedCards)}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ReplenishInfoPane);
