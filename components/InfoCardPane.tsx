import React, { useCallback } from "react";
import { useDispatch, useSelector } from "pages/matches/[...id]";

import { default as InformationCardComponent } from "./InformationCard";

import { Phases, Role } from "@/types/index";
import { InfoCardInClient } from "@/types/client";


const InfoCardPane = () => {
  const canPointOut = useSelector(state =>
    state.computed.self?.role === Role.Witness
    && state.matches.phases === Phases.ProvideTestimonials
  )
  const isCardHidden = useSelector(state => state.matches.phases < Phases.ProvideTestimonials)
  const showingInformationCards = useSelector((state) => state.matches.informationCards.slice(0, 6));
  const optionsSetted = useSelector((state) => state.pointOutInfo.optionsSetted);
  const dispatch = useDispatch();

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
          isHidden={isCardHidden}
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
