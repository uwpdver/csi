import React, { useContext } from "react";

import { useDispatch, useSelector } from "pages/matches/[...id]";
import { UserInfoContext } from "pages/_app";

import {
  ACTION_GAME_MURDER,
  ACTION_GAME_NEXT_SPEAKER,
  ACTION_GAME_SOLVE_CASE,
} from "@/lib/socket/constants";
import { useSocket } from "@/lib/socket";

import { Phases, Role } from "@/types/index";

import Avatar from "./Avatar";
import ReplenishInfoFooter from "./ReplenishInfoFooter";
import PointOutInfoFooter from "./PointOutInfoFooter";

export const ROLE_TO_TEXT_MAP = {
  [Role.Witness]: "目击者",
  [Role.Detective]: "侦探",
  [Role.Murderer]: "凶手",
  [Role.Accomplice]: "帮凶",
};

interface Props { curSpeakerId: number; }

const MatchesFooter = ({ curSpeakerId }: Props) => {
  const { userInfo } = useContext(UserInfoContext);
  const { socket } = useSocket();
  const {
    matchesId,
    roomId,
    murder,
    phases,
    measure,
    currentPlayerIndex,
    clue,
    canSelect,
    selectedMeasure,
    selectedClue,
    selectFor,
  } = useSelector((state) => {
    const murder = state.matches.players.find(
      (player) => player.role === Role.Murderer
    );
    return {
      matchesId: state.matches.id,
      roomId: state.matches.roomId,
      murder,
      phases: state.matches.phases,
      clue: state.matches.clue,
      measure: state.matches.measure,
      currentPlayerIndex: state.matches.currentPlayerIndex,
      canSelect: state.handCardSelect.canSelect,
      selectedMeasure: state.handCardSelect.selectedMeasure,
      selectedClue: state.handCardSelect.selectedClue,
      selectFor: state.handCardSelect.selectFor,
    };
  });
  const self = useSelector(state => state.computed.self);
  const dispatch = useDispatch();

  if (!userInfo) return null;

  // 点击确认破案按钮
  const handleComfirmSolve = () => {
    if (!selectedMeasure) {
      alert("请选择一张手段牌");
      return null;
    }
    if (!selectedClue) {
      alert("请选择一张线索牌");
      return null;
    }
    let payload = {
      userId: userInfo?.userId,
      roomId,
      matchesId,
      measure: selectedMeasure,
      clue: selectedClue,
    };
    if (selectFor === "murder") {
      socket?.emit(ACTION_GAME_MURDER, payload);
    } else if (self) {
      socket?.emit(ACTION_GAME_SOLVE_CASE, {
        ...payload,
        playerId: self?.id,
        currentPlayerIndex,
      });
    }
    dispatch({ type: "RESET_HAND_CARD_SELECT" });
  };

  // 点击破案按钮
  const handleSolve = () => {
    dispatch({ type: "START_SELECT_HAND_CARD", selectFor: "solveCase" });
  };

  // 点击取消破案按钮
  const handleCancelSolve = () => {
    dispatch({ type: "RESET_HAND_CARD_SELECT" });
  };

  // 点击结束本回合按钮
  const handleEndTheTurn = () => {
    if (self) {
      socket?.emit(ACTION_GAME_NEXT_SPEAKER, {
        userId: userInfo.userId,
        roomId,
        playerId: self?.id,
        matchesId: matchesId,
        currentPlayerIndex,
      });
    }
  };

  if (self?.role === Role.Witness && phases === Phases.ProvideTestimonials) {
    return <PointOutInfoFooter playerId={self.id} />;
  }

  if (phases === Phases.AdditionalTestimonials && self?.role === Role.Witness) {
    return <ReplenishInfoFooter playerId={self.id} />;
  }

  if (canSelect) {
    return (
      <>
        <Avatar nickname={self?.user.name} />
        <div className="flex-1">
          <div className="font-bold">
            {Phases.Murder === phases && self?.role === Role.Murderer
              ? "行凶："
              : "破案："}
          </div>
          <div className="text-sm">{`你选择了 ${selectedMeasure} 和 ${selectedClue}`}</div>
        </div>
        <button onClick={handleComfirmSolve}>确认</button>
        {selectFor === "solveCase" && (
          <button onClick={handleCancelSolve}>取消</button>
        )}
      </>
    );
  } else {
    return (
      <>
        <Avatar nickname={self?.user.name} />
        <div className="flex-1">
          <div>{self?.user.name}</div>
          <span className="text-sm text-gray-600">
            {self ? ROLE_TO_TEXT_MAP[self.role as Role] : ""}
          </span>
          {self?.role === Role.Murderer && measure && clue ? (
            <span className="text-sm ml-2">{`${measure} + ${clue}`}</span>
          ) : null}
        </div>
        {phases === Phases.Reasoning && curSpeakerId === self?.id && (
          <>
            {self.remainingNumOfSolveCase > 0 && (
              <button data-intro-id="solve-case-btn" onClick={handleSolve}>
                破案
              </button>
            )}
            <button data-intro-id="end-my-turn-btn" onClick={handleEndTheTurn}>
              结束回合
            </button>
          </>
        )}
        {phases > Phases.Murder && self?.role === Role.Witness && (
          <div className="text-right text-sm">
            <div>
              凶手是：<span className="font-bold">{murder?.user.name}</span>
            </div>
            <div>
              选择了：<span className="font-bold">{measure}</span> 和{" "}
              <span className="font-bold">{clue}</span>
            </div>
          </div>
        )}
      </>
    );
  }
};

export default React.memo(MatchesFooter);
