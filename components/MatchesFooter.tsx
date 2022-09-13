import React, { useContext } from "react";
import { useRouter } from "next/router";
import {
  ACTION_GAME_MURDER,
  ACTION_GAME_NEXT_SPEAKER,
  ACTION_GAME_QUIT,
  ACTION_GAME_SOLVE_CASE,
} from "../constants";
import { useDispatch, useSelector } from "./../pages/matches/[...id]";
import { socket, UserInfoContext } from "pages/_app";
import { Phases, Role } from "@/types/index";
import { PlayerInClient } from "@/types/client";
import Avatar from "./Avatar";
import ReplenishInfoFooter from "./ReplenishInfoFooter";
import PointOutInfoFooter from "./PointOutInfoFooter";

const ROLE_TO_TEXT_MAP = {
  [Role.Witness]: "目击者",
  [Role.Detective]: "侦探",
  [Role.Murderer]: "凶手",
  [Role.Accomplice]: "帮凶",
};

interface Props {
  self?: PlayerInClient;
  curSpeakerId: number;
}

const MatchesFooter = ({ self, curSpeakerId }: Props) => {
  const { userInfo } = useContext(UserInfoContext);
  const router = useRouter();
  const {
    matchesId,
    roomId,
    murder,
    phases,
    measure,
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
      canSelect: state.handCardSelect.canSelect,
      selectedMeasure: state.handCardSelect.selectedMeasure,
      selectedClue: state.handCardSelect.selectedClue,
      selectFor: state.handCardSelect.selectFor,
    };
  });
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
      socket.emit(ACTION_GAME_MURDER, payload);
    } else if (self) {
      socket.emit(ACTION_GAME_SOLVE_CASE, {
        ...payload,
        playerId: self?.id,
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
    socket.emit(ACTION_GAME_NEXT_SPEAKER, {
      userId: userInfo.userId,
      roomId,
      matchesId: matchesId,
    });
  };

  // 点击退出对局按钮
  const handleQuitMatchesBtnClick = () => {
    if (self) {
      socket.emit(ACTION_GAME_QUIT, self.id, roomId, matchesId);
    }
    router.replace(`/room/${roomId}`);
  };

  if (self?.role === Role.Witness && phases === Phases.ProvideTestimonials) {
    return <PointOutInfoFooter />;
  }

  if (phases === Phases.AdditionalTestimonials && self?.role === Role.Witness) {
    return <ReplenishInfoFooter />;
  }

  if (phases === Phases.DetectiveWin || phases === Phases.MurdererWin) {
    return (
      <>
        <div className="flex-1 text-sm">
          <div>
            凶手是：<span className="font-bold">{murder?.user.name}</span>
          </div>
          <div>
            选择了：<span className="font-bold">{measure}</span> 和{" "}
            <span className="font-bold">{clue}</span>
          </div>
        </div>
        <button onClick={handleQuitMatchesBtnClick}>退出对局</button>
      </>
    );
  } else if (canSelect) {
    return (
      <>
        <Avatar nickname={self?.user.name} />
        <div className="flex-1">
          <span className="font-bold">
            {Phases.Murder === phases && self?.role === Role.Murderer
              ? "行凶："
              : "破案："}
          </span>
          {`你选择了 ${selectedMeasure} 和 ${selectedClue}`}
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
          <span className="text-sm text-gray-500">
            {self ? ROLE_TO_TEXT_MAP[self.role as Role] : ""}
          </span>
          {self?.role === Role.Murderer && measure && clue ? (
            <span className="text-sm ml-2">{`${measure} + ${clue}`}</span>
          ) : null}
        </div>
        {phases === Phases.Reasoning && curSpeakerId === self?.id && (
          <>
            {self.remainingNumOfSolveCase > 0 && (
              <button onClick={handleSolve}>破案</button>
            )}
            <button onClick={handleEndTheTurn}>结束回合</button>
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
