import React, { useContext } from "react";
import { ACTION_GAME_ADDITIONAL_TESTIMONIALS } from "@/constants/index";
import { useDispatch, useSelector } from "pages/matches/[...id]";
import { socket, UserInfoContext } from "pages/_app";
import { isEmptyOption } from "@/utils/option";
import { InformationCardStatus } from "@/types/index";
import { OptionInClient } from "@/types/client";
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
  const dispatch = useDispatch();

  if (!userInfo) return null;
  const { userId } = userInfo;
  
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

  const hanleClickOptionNotSet = (index: number, e: React.MouseEvent) => {
    dispatch({ type: "SELECT_OPTION", index });
  };

  // 放弃
  const handleQuit = () => {
    socket.emit(ACTION_GAME_ADDITIONAL_TESTIMONIALS, {
      userId,
      roomId,
      matchesId,
      options: [],
      informationCards: pendingCards.map((card) => ({
        ...card,
        status: InformationCardStatus.Discard,
      })),
    });
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
      <ul className="flex flex-1 space-x-2 mx-2 mr-auto">
        {optionsNotSet.map(optionItemRender)}
      </ul>
      {pendingCards.length === 0 && <button onClick={handleReset}>撤销</button>}
      <button onClick={handleQuit}>放弃</button>
      {pendingCards.length === 0 && optionsNotSet.length === 0 && (
        <button onClick={handleConfirm}>确定</button>
      )}
    </>
  );
};

export default ReplenishInfoFooter;