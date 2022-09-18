import React, { useContext } from "react";
import Option from "./Option";
import { useDispatch, useSelector } from "pages/matches/[...id]";
import { UserInfoContext } from "pages/_app";
import { isEmptyOption } from "@/utils/option";
import { useSocket } from "@/lib/socket";
import { ACTION_GAME_PROVIDE_TESTIMONIALS } from "@/lib/socket/constants";
import { OptionInClient } from "@/types/client";

const PointOutInfoFooter = ({ playerId }: { playerId?: number }) => {
  const { userInfo } = useContext(UserInfoContext);
  const { roomId, matchesId, optionsSetted, optionsNotSet, curOptionIndex } =
    useSelector((state) => ({
      roomId: state.matches.roomId,
      matchesId: state.matches.id,
      ...state.pointOutInfo,
    }));
  const dispatch = useDispatch();
  const { socket } = useSocket();

  if (!userInfo) return null;
  const { userId } = userInfo;

  const handleConfirmPointOutInformation = () => {
    if (!playerId) return;
    if (optionsSetted.length !== 6 || optionsSetted.some(isEmptyOption)) {
      alert("还有未放置到信息卡上的选项物");
      return;
    }
    socket?.emit(ACTION_GAME_PROVIDE_TESTIMONIALS, {
      userId,
      roomId,
      playerId,
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
      className="shrink-0"
      onClick={hanleClickOptionNotSet.bind(null, index)}
      isSelected={curOptionIndex === index}
    />
  );

  return (
    <>
      <ul
        data-intro-id="pointout-info-footer"
        className="flex flex-1 space-x-2 overflow-auto"
      >
        {optionsNotSet.map(optionItemRender)}
      </ul>
      <button
        data-intro-id="comfirm-pointout-btn"
        className="ml-auto mr-0 rounded-full rounded-r-none shrink-0"
        onClick={handleConfirmPointOutInformation}
      >
        确定
      </button>
    </>
  );
};

export default PointOutInfoFooter;
