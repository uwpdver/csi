import React, { useContext, useEffect, useRef, useState } from "react";
import type { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router";
import ReactModal from "react-modal";
import { InformationCardsOnMatches } from "@prisma/client";
import { socket, UserInfoContext } from "../_app";
import { getMatchesById } from "../api/matches/[id]";
import InfoCardPane from "@/components/InfoCardPane";
import HandCardsPanel from "@/components/HandCardsPanel";
import ReplenishInfoPane from "@/components/ReplenishInfoPane";
import {
  ACTION_GAME_ADDITIONAL_TESTIMONIALS,
  ACTION_GAME_MURDER,
  ACTION_GAME_NEXT_SPEAKER,
  ACTION_GAME_PROVIDE_TESTIMONIALS,
  ACTION_GAME_SOLVE_CASE,
  ACTION_GAME_READY,
  BCST_GAME_STATE_UPDATE,
  ACTION_GAME_QUIT,
  BCST_GAME_ALL_PLAYER_READY,
  ACTION_CONNECT_ROOM,
} from "@/constants/index";
import {
  ServerGameAllPlayerReady,
  ServerGameStateUpdate,
} from "@/types/socket";
import { MatchesInClient, OptionInClient } from "@/types/client";
import { Phases, PlayerStatus, Role } from "@/types/index";
import { useConnectToRoom } from "@/utils/useConnectToRoom";

interface Props {
  matches: MatchesInClient;
  roomId: number;
  matchesId: number;
}

const ROLE_TO_TEXT_MAP = {
  [Role.Witness]: "目击者",
  [Role.Detective]: "侦探",
  [Role.Murderer]: "凶手",
  [Role.Accomplice]: "帮凶",
};

const Matches: NextPage<Props> = (props) => {
  const { userInfo } = useContext(UserInfoContext);
  const [matches, setMatches] = useState(props.matches);
  const [countDown, setCountDown] = useState(0);
  const [canSelect, setCanSelect] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [selectedPlayerIndex, setSelectedPlayerIndex] = useState(-1);
  const [selectedMeasure, setSelectedMeasure] = useState("");
  const [selectedClue, setSelectedClue] = useState("");
  const router = useRouter();
  const listRef = useRef<(HTMLElement | null)[]>([]);
  
  const {
    players,
    informationCards,
    phases,
    rounds,
    currentPlayerIndex,
    measure,
    clue,
  } = matches;

  const selfIndex = players.findIndex(
    (player) => player.userId === userInfo?.userId
  );

  const { roomId } = props;

  useConnectToRoom(roomId);

  const self = selfIndex > -1 ? players[selfIndex] : null;

  const playersCanSolve = players.filter((play) => play.role !== Role.Witness);

  const isMurderSelect =
    phases === Phases.Murder && self?.role === Role.Murderer;

  const phasesToTitleMap = [
    `开局阶段 ${countDown ? `${countDown}秒后开始行凶` : ""}`,
    "凶手正在行凶",
    "目击者正在提供证词",
    `推理阶段-第${rounds}轮-${playersCanSolve[currentPlayerIndex].user.name}的回合`,
    "帮凶正在行动",
    "目击证人正在补充证词",
    "游戏结束 侦探获得胜利",
    "游戏结束 凶手获得胜利",
  ];

  useEffect(() => {
    socket.emit(ACTION_CONNECT_ROOM, roomId);
  }, [roomId]);

  useEffect(() => {
    let timeoutHandle: any = null;
    if (countDown > 0) {
      timeoutHandle = setTimeout(() => {
        setCountDown(Math.max(countDown - 1, 0));
      }, 1000);
    }
    return () => {
      clearTimeout(timeoutHandle);
    };
  }, [countDown]);

  useEffect(() => {
    if (isMurderSelect) {
      setCanSelect(true);
    }
  }, [isMurderSelect]);

  useEffect(() => {
    if (self?.id && roomId && self.status === PlayerStatus.NotReady) {
      socket.emit(ACTION_GAME_READY, self.id, roomId, matches.id);
    }
  }, [self?.id, self?.status, roomId, matches.id]);

  // 更新游戏状态
  useEffect(() => {
    const updateMatchesState: ServerGameStateUpdate = (data) =>
      setMatches(data);
    socket.on(BCST_GAME_STATE_UPDATE, updateMatchesState);
    return () => {
      socket.off(BCST_GAME_STATE_UPDATE, updateMatchesState);
    };
  }, []);

  // 开始倒计时
  useEffect(() => {
    const startCountDown: ServerGameAllPlayerReady = (s) => setCountDown(s);
    socket.on(BCST_GAME_ALL_PLAYER_READY, startCountDown);
    return () => {
      socket.off(BCST_GAME_ALL_PLAYER_READY, startCountDown);
    };
  }, []);

  useEffect(() => {
    if (phases === Phases.Murder && self?.role === Role.Murderer) {
      const index = playersCanSolve.findIndex(
        (player) => player.role === Role.Murderer
      );
      const instance = listRef.current[index];
      if (instance instanceof HTMLElement) {
        instance.scrollIntoView({
          behavior: "smooth",
          inline: "start",
          block: "nearest",
        });
      }
    }
  }, [phases, playersCanSolve, self?.role]);

  const isPointOutInfo =
    [Phases.ProvideTestimonials, Phases.AdditionalTestimonials].includes(
      phases
    ) && self?.role === Role.Witness;

  if (!userInfo) {
    return null;
  }

  const handleClickHandCard =
    (playerIndex: number) =>
    (data: { type: string; name: string; playerId: number }) => {
      if (isMurderSelect && data.playerId !== self?.id) {
        alert("只能选择自己的手牌");
        return null;
      }
      setSelectedPlayerIndex(playerIndex);

      const isPlayerChanged =
        data.playerId !== playersCanSolve[selectedPlayerIndex]?.id;

      if (data.type === "measure") {
        setSelectedMeasure(selectedMeasure === data.name ? "" : data.name);
        if (isPlayerChanged) {
          setSelectedClue("");
        }
      } else {
        setSelectedClue(selectedClue === data.name ? "" : data.name);
        if (isPlayerChanged) {
          setSelectedMeasure("");
        }
      }
    };

  const handleComfirmSolve = () => {
    if (!userInfo) return null;
    if (isMurderSelect) {
      socket.emit(ACTION_GAME_MURDER, {
        userId: userInfo?.userId,
        roomId,
        matchesId: matches.id,
        measure: selectedMeasure,
        clue: selectedClue,
      });
    } else if (self) {
      socket.emit(ACTION_GAME_SOLVE_CASE, {
        userId: userInfo?.userId,
        roomId,
        playerId: self?.id,
        matchesId: matches.id,
        measure: selectedMeasure,
        clue: selectedClue,
      });
    }
    setCanSelect(false);
    setIsSolving(false);
    setSelectedClue("");
    setSelectedMeasure("");
    setSelectedPlayerIndex(-1);
  };

  const handleSolve = () => {
    setCanSelect(true);
    setIsSolving(true);
  };

  const handleCancelSolve = () => {
    setCanSelect(false);
    setIsSolving(false);
    setSelectedClue("");
    setSelectedMeasure("");
    setSelectedPlayerIndex(-1);
  };

  const handleEndTheTurn = () => {
    socket.emit(ACTION_GAME_NEXT_SPEAKER, {
      userId: userInfo.userId,
      roomId,
      matchesId: matches.id,
    });
  };

  const handleConfirmPointOut = (options: OptionInClient[]) => {
    socket.emit(ACTION_GAME_PROVIDE_TESTIMONIALS, {
      userId: userInfo?.userId,
      roomId,
      matchesId: matches.id,
      options,
    });
  };

  const handleConfirmReplenishInfo = (
    informationCards: Omit<InformationCardsOnMatches, "matcheId">[],
    options: OptionInClient[]
  ) => {
    socket.emit(ACTION_GAME_ADDITIONAL_TESTIMONIALS, {
      userId: userInfo?.userId,
      roomId,
      matchesId: matches.id,
      options,
      informationCards,
    });
  };

  const handleQuitReplenishInfo = (
    informationCards: Omit<InformationCardsOnMatches, "matcheId">[]
  ) => {
    socket.emit(ACTION_GAME_ADDITIONAL_TESTIMONIALS, {
      userId: userInfo?.userId,
      roomId,
      matchesId: matches.id,
      options: [],
      informationCards: informationCards,
    });
  };

  const defaultOptions = matches.options.map((option) => ({
    weight: option.optionWeight,
    indexOnCard: option.indexOnCard ?? -1,
  }));

  const murder = players.find((player) => player.role === Role.Murderer);

  const handleQuitMatchesBtnClick = () => {
    if (self) {
      socket.emit(ACTION_GAME_QUIT, self.id, roomId, matches.id);
    }
    router.replace(`/room/${roomId}`);
  };

  const footerRender = () => {
    if (phases === Phases.DetectiveWin || phases === Phases.MurdererWin) {
      return (
        <>
          <div className="flex-1">
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
          <div className="h-10 w-10 mr-2 bg-gray-200 rounded-full flex items-center justify-center">
            {self?.user.name?.slice(0, 1)}
          </div>
          <div className="flex-1">
            <span className="font-bold">
              {Phases.Murder === phases && self?.role === Role.Murderer
                ? "行凶："
                : "破案："}
            </span>
            {`你选择了 ${selectedMeasure} 和 ${selectedClue}`}
          </div>
          <button onClick={handleComfirmSolve}>确认</button>
          {isSolving && <button onClick={handleCancelSolve}>取消</button>}
        </>
      );
    } else {
      return (
        <>
          <div className="h-10 w-10 mr-2 bg-gray-200 rounded-full flex items-center justify-center">
            {self?.user.name?.slice(0, 1)}
          </div>
          <div className="flex-1">
            <div>{self?.user.name}</div>
            <span className="text-sm text-gray-500">
              {self ? ROLE_TO_TEXT_MAP[self.role as Role] : ""}
            </span>
            {self?.role === Role.Murderer && measure && clue ? (
              <span className="text-sm text-gray-500 ml-4">
                {`${measure} + ${clue}`}
              </span>
            ) : null}
          </div>
          {phases === Phases.Reasoning &&
            playersCanSolve[currentPlayerIndex].id === self?.id && (
              <>
                {self.remainingNumOfSolveCase > 0 && (
                  <button onClick={handleSolve}>破案</button>
                )}
                <button onClick={handleEndTheTurn}>结束回合</button>
              </>
            )}
          {phases > Phases.Murder && self?.role === Role.Witness && (
            <div className="text-right">
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

  return (
    <div className="px-4 min-h-screen flex flex-col">
      <ReactModal
        isOpen={phases === Phases.AdditionalTestimonials}
        preventScroll={true}
        className="p-4 bg-transparent inset-0 absolute pb-20"
        overlayClassName="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-75"
      >
        <ReplenishInfoPane
          defaultOptions={defaultOptions}
          isHidden={phases < Phases.ProvideTestimonials}
          defaultInformationCards={informationCards}
          isPointOutInfo={isPointOutInfo}
          onComfirm={handleConfirmReplenishInfo}
          onQuit={handleQuitReplenishInfo}
          role={self?.role || Role.Detective}
        />
      </ReactModal>
      <div className="pt-4">
        <header className="text-center mb-2 truncate overflow-hidden">
          {phasesToTitleMap[phases]}
        </header>
      </div>
      <InfoCardPane
        defaultOptions={defaultOptions}
        isHidden={phases < Phases.ProvideTestimonials}
        informationCards={informationCards.slice(0, 6)}
        isPointOutInfo={isPointOutInfo}
        onComfirm={handleConfirmPointOut}
      />
      <ul className="flex flex-nowrap space-x-4 mt-4 py-2 w-full overflow-x-scroll snap-x">
        {playersCanSolve.map((player, index) => (
          <li
            className="shrink-0 basis-full snap-center"
            key={player.id}
            ref={(ref) => {
              if (listRef && Array.isArray(listRef.current)) {
                listRef.current[index] = ref;
              }
            }}
          >
            <HandCardsPanel
              player={player}
              canSelect={canSelect}
              isSelected={selectedPlayerIndex === index}
              selectedMeasure={selectedMeasure}
              selectedClue={selectedClue}
              onClickCard={handleClickHandCard(index)}
            />
          </li>
        ))}
      </ul>

      <ul className="mt-2 mb-8 flex items-center justify-center space-x-4">
        {playersCanSolve.map((player, index) => (
          <li
            key={player.id}
            className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center"
            onClick={() => {
              if (listRef && Array.isArray(listRef.current)) {
                const instance = listRef.current[index];
                if (instance) {
                  instance.scrollIntoView({
                    behavior: "smooth",
                    inline: "start",
                    block: "nearest",
                  });
                }
              }
            }}
          >
            {player.user.name?.slice(0, 1)}
          </li>
        ))}
      </ul>
      <div className="w-full h-72"></div>
      <div className="sticky bottom-0 bg-white z-10 border-t border-t-black">
        <div className="flex items-center  py-2 space-x-2 h-16">
          {footerRender()}
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { query } = ctx;
  if (!Array.isArray(query.id) || query.id.length < 2) {
    return {
      notFound: true,
    };
  }
  const roomId = parseInt(query.id[0], 10);
  const matchesId = parseInt(query.id[1], 10);
  const matches = await getMatchesById(matchesId);
  return {
    props: {
      matches,
      matchesId,
      roomId,
    },
  };
};

export default Matches;
