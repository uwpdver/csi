import React, { useContext } from "react";

import { useDispatch, useSelector } from "pages/matches/[...id]";
import { UserInfoContext } from "pages/_app";

import { InformationCardStatus } from "@/types/index";
import { OptionInClient } from "@/types/client";

import { useSocket } from "@/lib/socket";
import { ACTION_GAME_ADDITIONAL_TESTIMONIALS } from "@/lib/socket/constants";

import { isEmptyOption } from "@/utils/option";

import Option from "./Option";

const ReplenishInfoFooter = () => {
  const { userInfo } = useContext(UserInfoContext);
  const {
    roomId,
    matchesId,
    optionsSetted,
    optionsNotSet,
    curOptionIndex,
    pendingCards,
    changedOptions,
    changedInfoCards,
  } = useSelector((state) => ({
    ...state.replenishPane,
    roomId: state.matches.roomId,
    matchesId: state.matches.id,
    pendingCards: state.replenishPane.informationCards
      .slice(6)
      .filter(({ status }) => status === InformationCardStatus.Pending),
  }));
  const playerId = useSelector(state => state.computed.self?.id);
  const dispatch = useDispatch();
  const { socket } = useSocket();

  if (!userInfo) return null;
  const { userId } = userInfo;

  // 确认
  const handleConfirm = () => {
    if (!playerId) return;
    if (optionsSetted.length !== 6 || optionsSetted.some(isEmptyOption)) {
      return;
    }
    socket?.emit(ACTION_GAME_ADDITIONAL_TESTIMONIALS, {
      userId,
      roomId,
      playerId,
      matchesId,
      options: changedOptions,
      informationCards: changedInfoCards,
    });
    dispatch({ type: "CLOSE_REPLENISH_INFO_MODAL" });
  };

  const hanleClickOptionNotSet = (index: number, e: React.MouseEvent) => {
    dispatch({ type: "SELECT_OPTION", index });
  };

  // 放弃
  const handleQuit = () => {
    if (!playerId) return;
    socket?.emit(ACTION_GAME_ADDITIONAL_TESTIMONIALS, {
      userId,
      roomId,
      playerId,
      matchesId,
      options: [],
      informationCards: pendingCards.map((card) => ({
        ...card,
        status: InformationCardStatus.Discard,
      })),
    });
    dispatch({ type: "CLOSE_REPLENISH_INFO_MODAL" });
  };

  // 撤销更改
  const handleReset = () => {
    dispatch({ type: "RESET_ALL" });
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
      <>
        <ul
          data-intro-id="replenish-info-footer__options"
          className="flex flex-1 space-x-2 mx-2 mr-auto"
        >
          {optionsNotSet.map(optionItemRender)}
        </ul>
        {pendingCards.length === 0 && (
          <button
            data-intro-id="replenish-info-footer__reset-btn"
            onClick={handleReset}
          >
            撤销
          </button>
        )}
        <button data-intro-id="replenish-info-footer__quit" onClick={handleQuit}>
          放弃
        </button>
        {pendingCards.length === 0 && optionsNotSet.length === 0 && (
          <button
            data-intro-id="replenish-info-footer__ok"
            onClick={handleConfirm}
          >
            确定
          </button>
        )}
      </>
    );
};

export default ReplenishInfoFooter;
