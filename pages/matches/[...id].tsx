import React, { useReducer, useContext, useEffect, useMemo, useCallback } from "react";
import type { GetServerSideProps, NextPage } from "next";
import ReactModal from "react-modal";

import { socket, UserInfoContext } from "pages/_app";
import { getMatchesById } from "pages/api/matches/[id]";

import InfoCardPane from "@/components/InfoCardPane";
import HandCardsPanel from "@/components/HandCardsPanel";
import ReplenishInfoPane from "@/components/ReplenishInfoPane";
import MatchesFooter from "@/components/MatchesFooter";

import reducer from "@/reducers/index";
import { InitState, ActionType } from "@/reducers/matches";

import {
  ACTION_GAME_READY,
  BCST_GAME_STATE_UPDATE,
  BCST_GAME_ALL_PLAYER_READY,
} from "@/constants/index";

import {
  ServerGameAllPlayerReady,
  ServerGameStateUpdate,
} from "@/types/socket";
import { MatchesInClient } from "@/types/client";
import { Phases, PlayerStatus, Role } from "@/types/index";

import { useConnectToRoom } from "@/utils/useConnectToRoom";
import { useCountDown } from "@/utils/useCountDown";
import { useListRef } from "@/utils/useListRef";
import Avatar from "@/components/Avatar";

interface Props {
  matches: MatchesInClient;
  roomId: number;
  matchesId: number;
}

const MatchesStateContext = React.createContext<{
  getMatchesState: useSelectorType;
}>({ getMatchesState: () => {} });

const MatchesDispatchContext = React.createContext<{
  dispatch: React.Dispatch<{
    [key: string]: any;
    type: ActionType;
  }>;
}>({ dispatch: () => {} });

const Matches: NextPage<Props> = ({ roomId, matchesId, matches }) => {
  useConnectToRoom(roomId);
  const { userInfo } = useContext(UserInfoContext);
  const [countDown, setCountDown] = useCountDown();
  const [handCardPaneInstances, appendToListRef] = useListRef();
  const [state, dispatch] = useReducer(
    reducer.matches.reducer,
    reducer.matches.getInitState(matches)
  );
  const {
    handCardSelect: { selectedPlayerIndex },
    matches: { players, phases, rounds, currentPlayerIndex },
  } = state;

  const playersCanSolve = useMemo(
    () => players.filter((play) => play.role !== Role.Witness),
    [players]
  );

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

  const self = useMemo(
    () => players.find((player) => player.userId === userInfo?.userId),
    [players, userInfo?.userId]
  );

  const scrollHandCardToView = (index: number) => {
    const instance = handCardPaneInstances[index];
    if (instance) {
      instance.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    }
  };

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
      dispatch({ type: "START_SELECT_HAND_CARD", selectFor: "murder" });
    }
  }, [phases, self?.role]);

  useEffect(() => {
    if (self?.id && roomId && self.status === PlayerStatus.NotReady) {
      socket.emit(ACTION_GAME_READY, self.id, roomId, matchesId);
    }
  }, [self?.id, self?.status, roomId, matchesId]);

  // 更新游戏状态
  useEffect(() => {
    const updateMatchesState: ServerGameStateUpdate = (data) =>
      dispatch({ type: "UPDATE_MATCHES_STATE", payload: data });
    socket.on(BCST_GAME_STATE_UPDATE, updateMatchesState);
    return () => {
      socket.off(BCST_GAME_STATE_UPDATE, updateMatchesState);
    };
  }, []);

  useEffect(() => {
    if (phases === Phases.Murder && self?.role === Role.Murderer) {
      const index = playersCanSolve.findIndex(
        (player) => player.role === Role.Murderer
      );
      scrollHandCardToView(index);
    }
  }, [phases, playersCanSolve, self?.role]);

  if (!userInfo) {
    return null;
  }

  return (
    <MatchesStateContext.Provider
      value={{
        getMatchesState: (callback: (state: InitState) => any) =>
          callback(state),
      }}
    >
      <MatchesDispatchContext.Provider value={{ dispatch }}>
        <div className="px-4 min-h-screen flex flex-col">
          <ReactModal
            isOpen={phases === Phases.AdditionalTestimonials}
            preventScroll={true}
            className="p-4 bg-transparent inset-0 absolute pb-20"
            overlayClassName="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-75"
          >
            <ReplenishInfoPane
              userId={userInfo.userId}
              roomId={roomId}
              matchesId={matchesId}
              self={self}
            />
          </ReactModal>

          <div className="pt-4">
            <header className="text-center mb-2 truncate overflow-hidden">
              {phasesToTitleMap[phases]}
            </header>
          </div>

          <InfoCardPane
            userId={userInfo.userId}
            roomId={roomId}
            matchesId={matchesId}
            self={self}
          />

          <ul className="flex flex-nowrap space-x-4 mt-4 py-2 w-full overflow-x-scroll snap-x">
            {playersCanSolve.map((player, index) => (
              <li
                className="shrink-0 basis-full snap-center"
                key={player.id}
                ref={appendToListRef.bind(null, index)}
              >
                <HandCardsPanel
                  isSelf={self?.id === player.id}
                  player={player}
                  index={index}
                  selectPlayerId={playersCanSolve[selectedPlayerIndex]?.id}
                />
              </li>
            ))}
          </ul>

          <ul className="mt-2 mb-8 flex items-center justify-center space-x-4">
            {playersCanSolve.map((player, index) => (
              <li
                key={player.id}
                onClick={scrollHandCardToView.bind(null, index)}
              >
                <Avatar nickname={player.user.name}/>
              </li>
            ))}
          </ul>

          <div className="w-full h-72"></div>

          <div className="sticky bottom-0 bg-white z-10 border-t border-t-black">
            <div className="flex items-center  py-2 space-x-2 h-16">
              <MatchesFooter
                self={self}
                curSpeakerId={playersCanSolve[currentPlayerIndex].id}
              />
            </div>
          </div>
        </div>
      </MatchesDispatchContext.Provider>
    </MatchesStateContext.Provider>
  );
};

type useSelectorType<S = any> = (cb: (state: InitState) => S) => S;

export function useSelector<S = any>(callback: (state: InitState) => S): S {
  const { getMatchesState } = useContext(MatchesStateContext);
  const cb = useCallback(callback, []);
  const selected = useMemo(()=>getMatchesState(cb), [cb, getMatchesState])
  return selected;
}

export const useDispatch = () => {
  const { dispatch } = useContext(MatchesDispatchContext);
  return dispatch;
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
