import React, {
  useReducer,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { GetServerSideProps } from "next";
import classnames from "classnames";
import nookies from "nookies";

import { NextPageWithLayout, UserInfoContext } from "pages/_app";
import * as matchesServices from "pages/api/matches/services";

import InfoCardPane from "@/components/InfoCardPane";
import HandCardsPanel from "@/components/HandCardsPanel";
import ReplenishInfoModal from "@/components/ReplenishInfoModal";
import MatchesFooter from "@/components/MatchesFooter";
import Avatar from "@/components/Avatar";
import MatchesIntro from "@/components/MatchesIntro";
import MatchesWelcomeModal from "@/components/MatchesWelcomeModal";
import AllHandleCardsModal from "@/components/AllHandleCardsModal";
import GameEndModal from "@/components/GameEndModal";
import { default as Header } from "@/components/MatchesHeader";
import { getLayout } from "@/components/Layout";

import reducer from "@/reducers/index";
import {
  InitState,
  ActionType,
} from "@/reducers/matches";

import {
  BCST_ERROR,
  BCST_GAME_STATE_UPDATE,
  BCST_GAME_ALL_PLAYER_READY,
} from "@/lib/socket/constants";
import {
  ServerErrorHander,
  ServerGameAllPlayerReady,
  ServerGameStateUpdate,
} from "@/lib/socket";
import { useSocket } from "@/lib/socket";

import { MatchesInClient, PlayerInClient } from "@/types/client";
import { Phases, Role } from "@/types/index";

import { useConnectToRoom } from "@/utils/useConnectToRoom";
import { useCountDown } from "@/utils/useCountDown";
import { useListRef } from "@/utils/useListRef";

interface Props {
  matches: MatchesInClient;
  roomId: number;
  matchesId: number;
}

type InitStateWithComputed = InitState & { computed: { self?: PlayerInClient, murder?: PlayerInClient, curSpeakerId?: number } }

type useSelectorType<S = any> = (cb: (state: InitStateWithComputed) => S) => S;

const MatchesStateContext = React.createContext<{
  getMatchesState: useSelectorType;
}>({ getMatchesState: () => { } });

const MatchesDispatchContext = React.createContext<{
  dispatch: React.Dispatch<{
    [key: string]: any;
    type: ActionType;
  }>;
}>({ dispatch: () => { } });

const Matches: NextPageWithLayout<Props> = ({ roomId, matchesId, matches }) => {
  useConnectToRoom(roomId);
  const { userInfo } = useContext(UserInfoContext);
  const [countDown, setCountDown] = useCountDown();
  const [handCardPaneInstances, appendToListRef] = useListRef();
  const { isConnected, socket } = useSocket();
  const [state, dispatch] = useReducer(
    reducer.matches.reducer,
    reducer.matches.getInitState(matches)
  );
  const {
    handCardSelect: { selectedPlayerIndex },
    matches: { players, phases, rounds, currentPlayerIndex, measure, clue },
  } = state;

  const playersCanSolve = useMemo(
    () => players.filter((play) => play.role !== Role.Witness),
    [players]
  );

  const curSpeakerId = useMemo(
    () => playersCanSolve[currentPlayerIndex].id,
    [playersCanSolve, currentPlayerIndex]
  );

  const self = useMemo(
    () => players.find((player) => player.userId === userInfo?.userId),
    [players, userInfo?.userId]
  );

  const murder = useMemo(() => players.find(
    (player) => player.role === Role.Murderer
  ), [players]);

  const phasesToTitleMap = [
    `???????????? ${countDown ? `${countDown}??????????????????` : ""}`,
    "??????????????????",
    `${self?.role === Role.Witness
      ? `???????????????: ${measure} ??? ${clue}`
      : "???????????????????????????"
    }`,
    `????????????-???${rounds}???-${playersCanSolve[currentPlayerIndex].user.name}?????????`,
    "??????????????????",
    "??????????????????????????????",
    "???????????? ??????????????????",
    "???????????? ??????????????????",
  ];

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

  // ???????????????
  useEffect(() => {
    const alertError: ServerErrorHander = (error) => alert(error.message);
    if (isConnected) {
      socket?.on(BCST_ERROR, alertError);
    }
    return () => {
      if (isConnected) {
        socket?.off(BCST_ERROR, alertError);
      }
    };
  }, [isConnected]);

  // ???????????????
  useEffect(() => {
    const startCountDown: ServerGameAllPlayerReady = (s) => setCountDown(s);
    if (isConnected) {
      socket?.on(BCST_GAME_ALL_PLAYER_READY, startCountDown);
    }
    return () => {
      if (isConnected) {
        socket?.off(BCST_GAME_ALL_PLAYER_READY, startCountDown);
      }
    };
  }, [isConnected]);

  useEffect(() => {
    if (phases === Phases.Murder && self?.role === Role.Murderer) {
      dispatch({ type: "START_SELECT_HAND_CARD", selectFor: "murder" });
      const index = playersCanSolve.findIndex(
        (player) => player.role === Role.Murderer
      );
      scrollHandCardToView(index);
    }
  }, [phases, self, playersCanSolve]);

  useEffect(() => {
    if (phases === Phases.AdditionalTestimonials) {
      dispatch({ type: "SYNC_REPLENISH_INFO" });
    }
  }, [phases]);

  useEffect(() => {
    if (phases === Phases.AdditionalTestimonials && self?.role === Role.Witness) {
      dispatch({ type: "OPEN_REPLENISH_INFO_MODAL" });
    }
  }, [phases, self]);

  useEffect(() => {
    if (phases === Phases.Reasoning && rounds === 1) {
      dispatch({ type: "POINT_OUT_INFO_SYNC" });
    }
  }, [phases, rounds]);

  // ??????????????????
  useEffect(() => {
    const updateMatchesState: ServerGameStateUpdate = (data) => {
      if (data) {
        dispatch({ type: "UPDATE_MATCHES_STATE", payload: data });
      }
    };

    if (isConnected) {
      socket?.on(BCST_GAME_STATE_UPDATE, updateMatchesState);
    }
    return () => {
      if (isConnected) {
        socket?.off(BCST_GAME_STATE_UPDATE, updateMatchesState);
      }
    };
  }, [isConnected]);

  return (
    <MatchesStateContext.Provider
      value={{
        getMatchesState: (callback: (state: InitStateWithComputed) => any) =>
          callback({ ...state, computed: { self, murder, curSpeakerId } }),
      }}
    >
      <MatchesDispatchContext.Provider value={{ dispatch }}>
        <>
          {/* ?????? */}
          <MatchesIntro />
          <ReplenishInfoModal />
          <GameEndModal />
          <MatchesWelcomeModal />

          {/* ??????????????? */}
          <Header>{phasesToTitleMap[phases]}</Header>

          {/* ???????????? */}
          <div className="flex-1 overflow-y-auto pb-16 px-4">
            <InfoCardPane />
            <ul
              data-intro-id="hand-cards-container"
              className="flex flex-nowrap space-x-4 mt-4 py-2 w-full overflow-x-scroll snap-x"
            >
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

            <div className="flex items-center mt-2 mb-8">
              <AllHandleCardsModal >
                <button className="">??????</button>
              </AllHandleCardsModal>
              <ul className="flex-1  flex items-center justify-end space-x-4 overflow-x-auto">
                {playersCanSolve.map((player, index) => (
                  <li
                    key={player.id}
                    onClick={scrollHandCardToView.bind(null, index)}
                  >
                    <Avatar className="shadow-md" nickname={player.user.name} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ??????????????? */}
          <div
            className={classnames(
              "h-16 px-4 py-2",
              {
                "bg-transparent fixed bottom-0 right-0 left-0 z-10": state.isReplenishModalOpen,
              }
            )}
          >
            <div
              data-intro-id="matches-footer"
              className="flex items-center space-x-2 "
            >
              <MatchesFooter />
            </div>
          </div>
        </>
      </MatchesDispatchContext.Provider>
    </MatchesStateContext.Provider>
  );
};

export function useSelector<S = any>(callback: (state: InitStateWithComputed) => S): S {
  const { getMatchesState } = useContext(MatchesStateContext);
  const cb = useCallback(callback, []);
  const selected = useMemo(() => getMatchesState(cb), [cb, getMatchesState]);
  return selected;
}

export const useDispatch = () => {
  const { dispatch } = useContext(MatchesDispatchContext);
  return dispatch;
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const cookies = nookies.get(ctx);
  if (!cookies.userId) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
      props: {
        room: null,
      },
    };
  }
  const { query } = ctx;
  if (!Array.isArray(query.id) || query.id.length < 2) {
    return {
      notFound: true,
    };
  }
  const roomId = parseInt(query.id[0], 10);
  const matchesId = parseInt(query.id[1], 10);
  const matches = await matchesServices.getDetailById(matchesId);
  return {
    props: {
      matches,
      matchesId,
      roomId,
    },
  };
};

Matches.getLayout = getLayout;

export default Matches;
