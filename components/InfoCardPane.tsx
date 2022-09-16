import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "pages/matches/[...id]";

import { default as InformationCardComponent } from "./InformationCard";

import { Phases, Role } from "@/types/index";
import { InfoCardInClient, PlayerInClient } from "@/types/client";

export interface Props {
  self?: PlayerInClient;
}

const InfoCardPane = ({ self }: Props) => {
  const { showingInformationCards, optionsSetted, phases } = useSelector(
    (state) => ({
      showingInformationCards: state.matches.informationCards.slice(0, 6),
      phases: state.matches.phases,
      ...state.pointOutInfo,
    })
  );
  const dispatch = useDispatch();

  const canPointOut =
    self?.role === Role.Witness && phases === Phases.ProvideTestimonials;

  const handleCardClick = useCallback(
    (orginIndex: number, subIndex: number) => {
      if (!canPointOut) return null;
      dispatch({
        type: "POINT_OUT_INFO_PUT_OPTION_ON_CARD",
        orginIndex,
        subIndex,
      });
    },
    [canPointOut]
  );

  const cardItemRender = (card: InfoCardInClient, index: number) => {
    const option = optionsSetted[index];
    return (
      <li className="shrink-0 basis-24" key={index}>
        <InformationCardComponent
          card={card}
          isHidden={phases < Phases.ProvideTestimonials}
          option={option}
          onClickItem={handleCardClick}
        />
      </li>
    );
  };

  return (
    <ul
      data-intro-id="info-cards-container"
      className="flex flex-nowrap overflow-x-scroll text-center relative space-x-2 pb-2"
    >
      {showingInformationCards.map(cardItemRender)}
    </ul>
  );
};

export default React.memo(InfoCardPane);
