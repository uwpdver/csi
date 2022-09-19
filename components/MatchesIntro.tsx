import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "pages/matches/[...id]";
import { Phases, Role } from "@/types/index";
import { savaIntroCompletedKeysToStorage } from "@/reducers/matches";

const Steps = dynamic(() => import("intro.js-react").then((mod) => mod.Steps), {
  ssr: false,
});

const MatchesIntro = () => {
  const dispatch = useDispatch();
  const { show, steps } = useSelector((state) => ({
    show: state.intro.show,
    steps: state.intro.steps,
  }));
  const phases = useSelector(state => state.matches.phases);
  const role = useSelector(state => state.computed.self?.role);
  const selfPlayerId = useSelector(state => state.computed.self?.id);
  const curSpeakerId = useSelector(state => state.computed.curSpeakerId);
  const canSelect = useSelector(state => state.handCardSelect.canSelect);
  const selectFor = useSelector(state => state.handCardSelect.selectFor);
  const isAllOptionsSetted = useSelector(state => state.pointOutInfo.optionsNotSet.length === 0);
  const isReplacedInfoCard = useSelector(state => state.replenishPane.optionsNotSet.length !== 0);
  const completedKeys = useSelector(state => state.intro.completedKeys);

  useEffect(() => {
    if (Object.keys(completedKeys).length !== 0) {
      savaIntroCompletedKeysToStorage(completedKeys);
    }
  }, [completedKeys]);
  
  // 行凶阶段的凶手
  useEffect(() => {
    if (phases === Phases.Murder && role === Role.Murderer) {
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
  }, [phases, role])

  // 提供信息阶段的的目击者
  useEffect(() => {
    if (phases === Phases.ProvideTestimonials && role === Role.Witness) {
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
  }, [phases, role])

  // 开始发言的发言人
  useEffect(() => {
    if (
      selfPlayerId === curSpeakerId &&
      role !== Role.Witness &&
      phases === Phases.Reasoning
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
            position: 'top',
          },
        ],
      });
    }
  }, [phases, role, curSpeakerId]);

  // 放置完指示物的目击者
  useEffect(() => {
    if (
      phases === Phases.ProvideTestimonials &&
      role === Role.Witness &&
      isAllOptionsSetted
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
  }, [phases, role, isAllOptionsSetted]);

  // 开始破案的自己
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

  // 补充信息的目击者
  useEffect(() => {
    if (phases === Phases.AdditionalTestimonials && role === Role.Witness) {
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
  }, [phases, role]);


  // 替换了场景卡的目击者
  useEffect(() => {
    if (
      phases === Phases.AdditionalTestimonials &&
      role === Role.Witness &&
      isReplacedInfoCard
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
  }, [phases, role, isReplacedInfoCard]);

  return (
    <Steps
      enabled={show}
      initialStep={0}
      steps={steps}
      onExit={() => dispatch({ type: "INTRO_HIDE" })}
      options={{
        showBullets: false,
        hidePrev: true,
        exitOnOverlayClick: false,
        prevLabel: "上一步",
        nextLabel: "下一步",
        doneLabel: "知道了",
      }}
    />
  );
};

export default React.memo(MatchesIntro);
