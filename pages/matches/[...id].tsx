import React, {
  useReducer,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Image from "next/image";
import ReactModal from "react-modal";
import classnames from "classnames";

import { NextPageWithLayout, UserInfoContext } from "pages/_app";
import { getMatchesById } from "pages/api/matches/[id]";

import InfoCardPane from "@/components/InfoCardPane";
import HandCardsPanel from "@/components/HandCardsPanel";
import ReplenishInfoPane from "@/components/ReplenishInfoPane";
import MatchesFooter from "@/components/MatchesFooter";
import Avatar from "@/components/Avatar";
import { getLayout } from "@/components/Layout";

import reducer from "@/reducers/index";
import {
  InitState,
  ActionType,
  savaIntroCompletedKeysToStorage,
} from "@/reducers/matches";

import {
  ACTION_GAME_READY,
  BCST_GAME_STATE_UPDATE,
  BCST_GAME_ALL_PLAYER_READY,
  ACTION_GAME_QUIT,
} from "@/constants/index";

import { ServerGameAllPlayerReady, ServerGameStateUpdate } from "@/lib/socket";
import { MatchesInClient } from "@/types/client";
import { Phases, PlayerStatus, Role } from "@/types/index";

import { useConnectToRoom } from "@/utils/useConnectToRoom";
import { useCountDown } from "@/utils/useCountDown";
import { useListRef } from "@/utils/useListRef";
import MatchesIntro from "@/components/MatchesIntro";
import MatchesWelcomeModal from "@/components/MatchesWelcomeModal";
import { useSocket } from "@/lib/socket";

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

const Matches: NextPageWithLayout<Props> = ({ roomId, matchesId, matches }) => {
  useConnectToRoom(roomId);
  const { userInfo } = useContext(UserInfoContext);
  const [countDown, setCountDown] = useCountDown();
  const router = useRouter();
  const [handCardPaneInstances, appendToListRef] = useListRef();
  const { isConnected, socket } = useSocket();
  const [state, dispatch] = useReducer(
    reducer.matches.reducer,
    reducer.matches.getInitState(matches)
  );
  const {
    isWelcomeModalOpen,
    replenishPane: { optionsNotSet },
    handCardSelect: { selectedPlayerIndex, selectFor, canSelect },
    matches: { players, phases, rounds, currentPlayerIndex, measure, clue },
    intro: { completedKeys },
  } = state;

  const playersCanSolve = useMemo(
    () => players.filter((play) => play.role !== Role.Witness),
    [players]
  );

  const self = useMemo(
    () => players.find((player) => player.userId === userInfo?.userId),
    [players, userInfo?.userId]
  );

  const murder = state.matches.players.find(
    (player) => player.role === Role.Murderer
  );

  const phasesToTitleMap = [
    `开局阶段 ${countDown ? `${countDown}秒后开始行凶` : ""}`,
    "凶手正在行凶",
    `${
      self?.role === Role.Witness
        ? `凶手选择了: ${measure} 和 ${clue}`
        : "目击者正在提供证词"
    }`,
    `推理阶段-第${rounds}轮-${playersCanSolve[currentPlayerIndex].user.name}的回合`,
    "帮凶正在行动",
    "目击证人正在补充证词",
    "游戏结束 侦探获得胜利",
    "游戏结束 凶手获得胜利",
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

  // 开始倒计时
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
    switch (phases) {
      case Phases.Init:
        dispatch({ type: "OPEN_WELCOME_MODAL" });
        break;
      case Phases.Murder:
        if (self?.role === Role.Murderer) {
          dispatch({ type: "START_SELECT_HAND_CARD", selectFor: "murder" });
          const index = playersCanSolve.findIndex(
            (player) => player.role === Role.Murderer
          );
          scrollHandCardToView(index);
          setTimeout(
            () =>
              dispatch({
                type: "INTRO_SHOW",
                key: "intro_murder",
                steps: [
                  {
                    element: '[data-intro-id="hand-cards-container"]',
                    intro: "选择一张手法牌（红色）和一张线索牌（白色）",
                  },
                ],
              }),
            500
          );
        }
        break;
      case Phases.ProvideTestimonials:
        if (self?.role === Role.Witness) {
          dispatch({
            type: "INTRO_SHOW",
            key: "intro_pointout",
            steps: [
              {
                element: '[data-intro-id="matches-footer"]',
                intro:
                  "点击红色指示物，指示物上的数字代表对应信息的重要程度，将其放在信息卡的词条上来指示出一条指向凶手的【作案手法】或【线索】相关的信息",
              },
              {
                element: '[data-intro-id="info-cards-container"]',
                intro: "点击与之对应的信息词条，将指示物放置",
              },
              {
                element: '[data-intro-id="info-cards-container"]',
                intro: "将所有的指示物都放置在信息卡的词条上",
              },
            ],
          });
        }
        break;
      case Phases.AdditionalTestimonials:
        dispatch({ type: "SYNC_REPLENISH_INFO" });
        if (self?.role === Role.Witness) {
        }
        break;
      default:
        break;
    }
  }, [phases, self?.role, playersCanSolve]);

  useEffect(() => {
    if (phases === Phases.Reasoning && rounds === 1) {
      dispatch({ type: "POINT_OUT_INFO_SYNC" });
    }
  }, [phases, rounds]);

  // 更新游戏状态
  useEffect(() => {
    const updateMatchesState: ServerGameStateUpdate = (data) => {
      dispatch({ type: "UPDATE_MATCHES_STATE", payload: data });
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

  useEffect(() => {
    if (Object.keys(completedKeys).length !== 0) {
      savaIntroCompletedKeysToStorage(completedKeys);
    }
  }, [completedKeys]);

  const isAllSetted = state.pointOutInfo.optionsNotSet.length === 0;

  useEffect(() => {
    if (
      isAllSetted &&
      self?.role === Role.Witness &&
      phases === Phases.ProvideTestimonials
    ) {
      dispatch({
        type: "INTRO_SHOW",
        key: "intro_pointout_comfirm",
        steps: [
          {
            element: '[data-intro-id="comfirm-pointout-btn"]',
            intro: "点击确定来完成指证",
            position: "top",
          },
        ],
      });
    }
  }, [isAllSetted, self, phases]);

  useEffect(() => {
    if (
      self?.id === playersCanSolve[currentPlayerIndex].id &&
      self?.role !== Role.Witness &&
      phases === Phases.Reasoning &&
      rounds === 1
    ) {
      dispatch({
        type: "INTRO_SHOW",
        key: "intro_pointout_comfirm",
        steps: [
          {
            element: '[data-intro-id="matches-footer"]',
            intro: (
              <p>
                现在是你的回合，你在自己的回合阐述你的推理和猜测来帮助所有侦探找出真相。
              </p>
            ),
          },
          {
            element: '[data-intro-id="solve-case-btn"]',
            intro: (
              <>
                <p>
                  点击<b>【破案】</b>来使用你<b>全场唯一</b>的一次
                  <b>【破案】</b>机会。
                </p>
                <p>
                  如果指认结果正确，侦探将获得本场游戏的<b>胜利。</b>
                </p>
              </>
            ),
          },
          {
            element: '[data-intro-id="end-my-turn-btn"]',
            intro: (
              <p>
                点击<b>【结束回合】</b>可以结束自己的回合，由下一位玩家行动。
              </p>
            ),
          },
        ],
      });
    }
  }, [self, phases, rounds, currentPlayerIndex, playersCanSolve]);

  useEffect(() => {
    if (canSelect && selectFor === "solveCase") {
      dispatch({
        type: "INTRO_SHOW",
        key: "intro_additional_testimonials",
        steps: [
          // 选中的新场景卡应该由选中的样式
          {
            element: '[data-intro-id="hand-cards-container"]',
            intro: (
              <p>
                指出你怀疑的 <b>【手段卡】</b>和<b>【线索卡】</b>
              </p>
            ),
          },
        ],
      });
    }
  }, [canSelect, selectFor]);

  useEffect(() => {
    if (
      self?.role === Role.Witness &&
      phases === Phases.AdditionalTestimonials &&
      rounds === 2
    ) {
      dispatch({
        type: "INTRO_SHOW",
        key: "intro_additional_testimonials",
        steps: [
          // 选中的新场景卡应该由选中的样式
          {
            element: '[data-intro-id="new-info-cards-container"]',
            intro: (
              <p>这里是新增的场景卡，点击该区域信息卡片顶部的名字来选择该卡</p>
            ),
          },
          {
            element: '[data-intro-id="replaceable-info-cards-container"]',
            intro: <p>再次点击该区域信息卡片顶部的名字来替换掉一张卡</p>,
          },
        ],
      });
    }
  }, [self, phases, rounds]);

  useEffect(() => {
    if (
      self?.role === Role.Witness &&
      phases === Phases.AdditionalTestimonials &&
      optionsNotSet.length !== 0
    ) {
      dispatch({
        type: "INTRO_SHOW",
        key: "intro_additional_testimonials_reset_option",
        steps: [
          {
            element: '[data-intro-id="replenish-info-footer__options"]',
            intro: (
              <p>
                被替换的信息卡上的选项物会被重置，你可以点击指示物，然后将其重新放置在刚换上的信息卡的词条上。
              </p>
            ),
          },
          {
            element: '[data-intro-id="replenish-info-footer__reset-btn"]',
            intro: <p>如果你对替换的结果不满意，可以点击撤销重新替换。</p>,
          },
        ],
      });
    }
  }, [self, phases, optionsNotSet]);

  const handleKnowItBtnClick = () => {
    if (self?.id && roomId && self.status === PlayerStatus.NotReady) {
      socket?.emit(ACTION_GAME_READY, self.id, roomId, matchesId);
    }
    dispatch({ type: "CLOSE_WELCOME_MODAL" });
  };

  const handleQuitMatchesBtnClick = () => {
    if (self) {
      socket?.emit(ACTION_GAME_QUIT, self.id, roomId, matchesId);
    }
    router.replace(`/room/${roomId}`);
  };

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
        <>
          {self && <MatchesIntro self={self} />}
          <ReactModal
            isOpen={phases === Phases.AdditionalTestimonials}
            preventScroll={true}
            className="p-4 bg-transparent inset-0 absolute"
            overlayClassName="fixed inset-0 backdrop-blur-sm bg-white bg-opacity-75"
          >
            <ReplenishInfoPane
              userId={userInfo.userId}
              roomId={roomId}
              matchesId={matchesId}
              self={self}
            />
          </ReactModal>
          <ReactModal
            isOpen={
              Phases.DetectiveWin === phases || Phases.MurdererWin === phases
            }
            style={{
              content: {
                background: "none",
                border: "none",
                inset: 0,
              },
              overlay: {
                backgroundColor: "rgba(0,0,0,0.75)",
                zIndex: 99,
                backdropFilter: "blur(4px)",
              },
            }}
          >
            <div className="text-center">
              <div className="m-4 text-yellow-100 text-xl -mb-8">
                <div>{`凶手是：${murder?.user.name}`}</div>
                <div>{`选择了：【${measure}】和【${clue}】`}</div>
              </div>
              <Image
                src="/images/confetti_ball_3d.png"
                alt=""
                width={200}
                height={200}
              />
              <Image
                src={
                  Phases.DetectiveWin === phases
                    ? "/images/detective_3d_default.png"
                    : "/images/bust_in_silhouette_3d.png"
                }
                alt=""
                width={200}
                height={200}
              />
              <div
                className={classnames(
                  "text-3xl text-yellow-100 h-16 rounded-full flex items-center font-bold justify-center w-fit mx-auto px-10 -mt-5 min-w-[240px]",
                  {
                    "bg-blue-400": Phases.DetectiveWin === phases,
                    "bg-gray-800": Phases.DetectiveWin !== phases,
                  }
                )}
              >
                {Phases.DetectiveWin === phases ? "侦探胜利" : "凶手胜利"}
              </div>
              <button
                className="mt-4 h-16 min-w-[240px] rounded-full text-2xl"
                onClick={handleQuitMatchesBtnClick}
              >
                退出对局
              </button>
            </div>
          </ReactModal>
          <MatchesWelcomeModal
            isOpen={isWelcomeModalOpen}
            self={self}
            onOKBtnClick={handleKnowItBtnClick}
          />

          {/* 顶部标题栏 */}
          <header className="text-center mt-2 mx-4 mb-2 truncate overflow-hidden">
            {phasesToTitleMap[phases]}
          </header>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto pb-16 px-4">
            <div className="pt-4"></div>

            <InfoCardPane self={self} />

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

            <ul className="mt-2 mb-8 flex items-center justify-center space-x-4">
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

          {/* 底部命令栏 */}
          <div
            className={classnames(
              "fixed bottom-0 right-0 left-0 bg-gray-100 z-10 border-t border-t-black h-16 px-4 py-2",
              {
                "bg-transparent": phases === Phases.AdditionalTestimonials,
              }
            )}
          >
            <div
              data-intro-id="matches-footer"
              className="flex items-center space-x-2 "
            >
              <MatchesFooter
                self={self}
                curSpeakerId={playersCanSolve[currentPlayerIndex].id}
              />
            </div>
          </div>
        </>
      </MatchesDispatchContext.Provider>
    </MatchesStateContext.Provider>
  );
};

type useSelectorType<S = any> = (cb: (state: InitState) => S) => S;

export function useSelector<S = any>(callback: (state: InitState) => S): S {
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

Matches.getLayout = getLayout;

export default Matches;
