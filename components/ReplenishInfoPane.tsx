import React, { useReducer, useMemo, useCallback, useEffect } from "react";
import {
  InfoCardInClient,
  OptionInClient,
  PlayerInClient,
} from "@/types/client";
import { InformationCardStatus, Role } from "@/types/index";
import reducers from "@/reducers/index";
import { default as InformationCardComponent } from "./InformationCard";
import { ACTION_GAME_ADDITIONAL_TESTIMONIALS } from "@/constants/index";
import { useDispatch, useSelector } from "pages/matches/[...id]";
import { socket } from "pages/_app";
import Option from "./Option";
import { createOption, isEmptyOption } from "@/utils/option";

export interface Props {
  userId: number;
  roomId: number;
  matchesId: number;
  self?: PlayerInClient;
}

const ReplenishInfoPane = ({ userId, roomId, matchesId, self }: Props) => {
  const {
    optionsSetted,
    optionsNotSet,
    curOptionIndex,
    informationCards,
    changedOptions,
    changedInfoCards,
  } = useSelector((state) => ({
    ...state.replenishPane,
  }));
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
            onClickItem={handleClickItem}
            onClick={handleCardClick}
          />
        </li>
      );
    },
    [optionsSettedShowed, isWitness]
  );

  const notShowingCardPaneRender = (
    name: string,
    cards: InfoCardInClient[]
  ) => {
    if (!cards.length) return null;
    return (
      <div>
        <div className="mt-4 mb-2">{name}</div>
        <ul className="flex flex-nowrap space-x-2 text-center relative">
          {cards.map(cardItemRender)}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {/* 场上的场景卡 */}
        <div className="mb-2">场上的场景卡</div>
        <ul className="flex flex-nowrap overflow-x-scroll text-center relative space-x-2 pb-2">
          {showingCards.map(cardItemRender)}
        </ul>
        {/* 其他卡片 */}
        <div className="flex space-x-2">
          {notShowingCardPaneRender("新增的场景卡", newCards)}
          {notShowingCardPaneRender("废弃的场景卡", discardedCards)}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ReplenishInfoPane);
