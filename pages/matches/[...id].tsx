import React, {
  useReducer,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { GetServerSideProps, NextPage } from "next";
import ReactModal from "react-modal";
import { InformationCardsOnMatches } from "@prisma/client";
import { socket, UserInfoContext } from "../_app";
import { getMatchesById } from "../api/matches/[id]";
import InfoCardPane from "@/components/InfoCardPane";
import HandCardsPanel from "@/components/HandCardsPanel";
import ReplenishInfoPane from "@/components/ReplenishInfoPane";
import {
  ACTION_GAME_ADDITIONAL_TESTIMONIALS,
  ACTION_GAME_PROVIDE_TESTIMONIALS,
  ACTION_GAME_READY,
  BCST_GAME_STATE_UPDATE,
  BCST_GAME_ALL_PLAYER_READY,
} from "@/constants/index";
import {
  ServerGameAllPlayerReady,
  ServerGameStateUpdate,
} from "@/types/socket";
import { MatchesInClient, OptionInClient } from "@/types/client";
import { Phases, PlayerStatus, Role } from "@/types/index";
import { useConnectToRoom } from "@/utils/useConnectToRoom";
import reducer from "@/reducers/index";
import { InitState, ActionType } from "@/reducers/matches";
import MatchesFooter from "@/components/MatchesFooter";

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

const Matches: NextPage<Props> = (props) => {
  const { userInfo } = useContext(UserInfoContext);
  const [countDown, setCountDown] = useState(0);
  const [state, dispatch] = useReducer(
    reducer.matches.reducer,
    reducer.matches.getInitState(props.matches)
  );
  const {
    matches: {
      players,
      informationCards,
      phases,
      rounds,
      currentPlayerIndex,
      options,
    },
  } = state;
  const listRef = useRef<(HTMLElement | null)[]>([]);

  const { roomId, matchesId } = props;

  useConnectToRoom(roomId);

  const selfIndex = useMemo(
    () => players.findIndex((player) => player.userId === userInfo?.userId),
    [players, userInfo?.userId]
  );

  const self = players[selfIndex];

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

  const defaultOptions = options.map((option) => ({
    weight: option.optionWeight,
    indexOnCard: option.indexOnCard ?? -1,
  }));

  const isPointOutInfo = useMemo(
    () =>
      [Phases.ProvideTestimonials, Phases.AdditionalTestimonials].includes(
        phases
      ) && self?.role === Role.Witness,
    [phases, self?.role]
  );

  const murder = players.find((player) => player.role === Role.Murderer);

  const scrollHandCardToView = (index: number) => {
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
  };

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

  const selectPlayerId =
    playersCanSolve[state.handCardSelect.selectedPlayerIndex]?.id;

  // 点击确认按钮
  const handleConfirmPointOut = (options: OptionInClient[]) => {
    socket.emit(ACTION_GAME_PROVIDE_TESTIMONIALS, {
      userId: userInfo?.userId,
      roomId,
      matchesId,
      options,
    });
  };

  // [补充信息弹窗]点击确认按钮
  const handleConfirmReplenishInfo = (
    informationCards: Omit<InformationCardsOnMatches, "matcheId">[],
    options: OptionInClient[]
  ) => {
    socket.emit(ACTION_GAME_ADDITIONAL_TESTIMONIALS, {
      userId: userInfo?.userId,
      roomId,
      matchesId,
      options,
      informationCards,
    });
  };

  // [补充信息弹窗]点击放弃按钮
  const handleQuitReplenishInfo = (
    informationCards: Omit<InformationCardsOnMatches, "matcheId">[]
  ) => {
    socket.emit(ACTION_GAME_ADDITIONAL_TESTIMONIALS, {
      userId: userInfo?.userId,
      roomId,
      matchesId,
      options: [],
      informationCards: informationCards,
    });
  };

  const getMatchesState = (callback: (state: InitState) => any) =>
    callback(state);

  return (
    <MatchesStateContext.Provider value={{ getMatchesState }}>
      <MatchesDispatchContext.Provider value={{ dispatch }}>
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
                  isSelf={self.id === player.id}
                  player={player}
                  index={index}
                  selectPlayerId={selectPlayerId}
                />
              </li>
            ))}
          </ul>

          <ul className="mt-2 mb-8 flex items-center justify-center space-x-4">
            {playersCanSolve.map((player, index) => (
              <li
                key={player.id}
                className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center"
                onClick={scrollHandCardToView.bind(null, index)}
              >
                {player.user.name?.slice(0, 1)}
              </li>
            ))}
          </ul>

          <div className="w-full h-72"></div>

          <div className="sticky bottom-0 bg-white z-10 border-t border-t-black">
            <div className="flex items-center  py-2 space-x-2 h-16">
              <MatchesFooter
                murder={murder}
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
  return getMatchesState(callback);
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
