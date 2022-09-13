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
import { useSelector } from "pages/matches/[...id]";
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
  const { initInformationCards, initOptions } = useSelector((state) => ({
    initInformationCards: state.matches.informationCards,
    initOptions: state.matches.options.map((option) =>
      createOption(option.optionWeight, option.indexOnCard)
    ),
  }));

  const [
    {
      optionsSetted, // 已被放置的所有选项物
      optionsNotSet, // 未被放置的所有选项物
      curOptionIndex, // 选中的未被放置的选项物的在列表中的索引
      informationCards, // 信息卡列表
      changedOptions, // 改动过的选项物
      changedInfoCards, // 改动过的信息卡
    },
    dispatch,
  ] = useReducer(
    reducers.replenishPane.reducer,
    reducers.replenishPane.getInitState({
      initInformationCards,
      initOptions,
    })
  );

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

  useEffect(() => {
    if (initInformationCards.length > 0) {
      dispatch({
        type: "UPDATE_INFORMATION_CARDS",
        infoCards: initInformationCards,
      });
    }
  }, [initInformationCards]);

  useEffect(() => {
    if (initOptions.length > 0) {
      dispatch({ type: "UPDATE_OPTIONS", options: initOptions });
    }
  }, [initOptions]);

  const hanleClickOptionNotSet = (index: number, e: React.MouseEvent) => {
    dispatch({ type: "SELECT_OPTION", index });
  };

  // 撤销更改
  const handleReset = () => {
    dispatch({ type: "RESET_ALL" });
  };

  // 确认
  const handleConfirm = () => {
    if (optionsSetted.length !== 6 || optionsSetted.some(isEmptyOption)) {
      return;
    }
    socket.emit(ACTION_GAME_ADDITIONAL_TESTIMONIALS, {
      userId,
      roomId,
      matchesId,
      options: changedOptions,
      informationCards: changedInfoCards,
    });
  };

  // 放弃
  const handleQuit = () => {
    socket.emit(ACTION_GAME_ADDITIONAL_TESTIMONIALS, {
      userId,
      roomId,
      matchesId,
      options: [],
      informationCards: newCards.map((card) => ({
        ...card,
        status: InformationCardStatus.Discard,
      })),
    });
  };

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
        <li className="shrink-0 basis-20" key={index}>
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

  const optionItemRender = (option: OptionInClient, index: number) => (
    <Option
      key={option.weight}
      weight={option.weight}
      onClick={hanleClickOptionNotSet.bind(null, index)}
      isSelected={index === curOptionIndex}
    />
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {/* 场上的场景卡 */}
        <div className="mb-2">场上的场景卡</div>
        <ul className="grid grid-cols-4 gap-1 space-x-2 text-center relative">
          {showingCards.map(cardItemRender)}
        </ul>

        {/* 可放置的选项物 */}
        {isWitness && (
          <div className="flex items-center mt-4">
            <ul className="flex flex-1 space-x-2 mx-2">
              {optionsNotSet.map(optionItemRender)}
            </ul>

            <button
              className="ml-auto mr-0 rounded-full rounded-r-none"
              onClick={handleReset}
            >
              撤销
            </button>
          </div>
        )}

        {/* 其他卡片 */}
        <div className="flex space-x-2">
          {notShowingCardPaneRender("新增的场景卡", newCards)}
          {notShowingCardPaneRender("废弃的场景卡", discardedCards)}
        </div>
      </div>

      {/* 底部命令栏 */}
      {isWitness && (
        <div className="flex space-x-2 mt-8">
          <button className="flex-1" onClick={handleConfirm}>
            确定
          </button>
          <button className="flex-1" onClick={handleQuit}>
            放弃
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ReplenishInfoPane);
