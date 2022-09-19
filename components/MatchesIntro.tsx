import React from "react";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "pages/matches/[...id]";
import { PlayerInClient } from "@/types/client";

const Steps = dynamic(() => import("intro.js-react").then((mod) => mod.Steps), {
  ssr: false,
});

interface Props {
  self: PlayerInClient;
}

const MatchesIntro = ({}: Props) => {
  const { show, steps } = useSelector((state) => ({
    show: state.intro.show,
    steps: state.intro.steps,
  }));
  const dispatch = useDispatch();
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
