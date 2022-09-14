import React, { useContext } from "react";
import Option from "./Option";
import { ACTION_GAME_PROVIDE_TESTIMONIALS } from "@/constants/index";
import { useDispatch, useSelector } from "pages/matches/[...id]";
import { socket, UserInfoContext } from "pages/_app";
import { isEmptyOption } from "@/utils/option";
import { OptionInClient } from "@/types/client";

const PointOutInfoFooter = () => {
  const { userInfo } = useContext(UserInfoContext);
  const { roomId, matchesId, optionsSetted, optionsNotSet, curOptionIndex } =
    useSelector((state) => ({
      roomId: state.matches.roomId,
      matchesId: state.matches.id,
      ...state.pointOutInfo,
    }));
  const dispatch = useDispatch();

  if (!userInfo) return null;
  const { userId } = userInfo;

  const handleConfirmPointOutInformation = () => {
    if (optionsSetted.length !== 6 || optionsSetted.some(isEmptyOption)) {
      alert('还有未放置到信息卡上的选项物')
      return;
    }
    socket.emit(ACTION_GAME_PROVIDE_TESTIMONIALS, {
      userId,
      roomId,
      matchesId,
      options: optionsSetted,
    });
  };

  const hanleClickOptionNotSet = (index: number) => {
    dispatch({
      type: "POINT_OUT_INFO_SELECT_OPTION",
      index: index === curOptionIndex ? -1 : index,
    });
  };

  const optionItemRender = (option: OptionInClient, index: number) => (
    <Option
      key={option.weight}
      weight={option.weight}
      onClick={hanleClickOptionNotSet.bind(null, index)}
      isSelected={curOptionIndex === index}
    />
  );

  return (
    <>
      <ul className="flex flex-1 space-x-2">
        {optionsNotSet.map(optionItemRender)}
      </ul>
      <button
        className="ml-auto mr-0 rounded-full rounded-r-none"
        onClick={handleConfirmPointOutInformation}
      >
        确定
      </button>
    </>
  );
};

export default PointOutInfoFooter;