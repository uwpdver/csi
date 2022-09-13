import React, { useState, useEffect, useCallback } from "react";
import { socket } from "pages/_app";
import { useSelector } from "pages/matches/[...id]";

import Option from "./Option";
import { default as InformationCardComponent } from "./InformationCard";

import { ACTION_GAME_PROVIDE_TESTIMONIALS } from "@/constants/index";

import { Phases, Role } from "@/types/index";
import {
  InfoCardInClient,
  OptionInClient,
  PlayerInClient,
} from "@/types/client";

import {
  createOption,
  createEmptyOptions,
  isEmptyOption,
} from "@/utils/option";

export interface Props {
  userId: number;
  roomId: number;
  matchesId: number;
  self?: PlayerInClient;
}

const InfoCardPane = ({ userId, roomId, matchesId, self }: Props) => {
  const { initInformationCards, initOptions, phases } = useSelector(
    (state) => ({
      initInformationCards: state.matches.informationCards.slice(0, 6),
      initOptions: state.matches.options.map((option) =>
        createOption(option.optionWeight, option.indexOnCard)
      ),
      phases: state.matches.phases,
    })
  );

  const [optionsSetted, setOptionsSetted] = useState(
    initOptions.length > 0 ? initOptions : createEmptyOptions(6)
  );
  const [optionsNotSet, setOptionsNotset] = useState(createEmptyOptions(6));
  const [curOptionIndex, setCurOptionIndex] = useState(-1);

  useEffect(() => {
    if (initOptions.length > 0) {
      setOptionsNotset([]);
      setOptionsSetted(initOptions);
    }
  }, [initOptions]);

  const canPointOut =
    self?.role === Role.Witness && phases === Phases.ProvideTestimonials;

  const handleCardClick = useCallback(
    (orginIndex: number, subIndex: number) => {
      if (!canPointOut) return null;
      const optionSetted = optionsSetted[orginIndex];
      const optionNotSet = optionsNotSet[curOptionIndex];
      const copyOptionsSetted = [...optionsSetted];
      const copyOptionsNotSet = [...optionsNotSet];
      copyOptionsSetted[orginIndex] = optionNotSet
        ? createOption(optionNotSet.weight, subIndex)
        : createOption();
      if (optionNotSet) copyOptionsNotSet.splice(curOptionIndex, 1);
      if (!isEmptyOption(optionSetted)) {
        copyOptionsNotSet.push(createOption(optionSetted.weight));
      }
      setOptionsSetted(copyOptionsSetted);
      setOptionsNotset(copyOptionsNotSet);
      setCurOptionIndex(-1);
    },
    [canPointOut, optionsSetted, optionsNotSet, curOptionIndex]
  );

  const handleConfirmPointOutInformation = () => {
    if (optionsSetted.length !== 6 || optionsSetted.some(isEmptyOption)) {
      return;
    }
    socket.emit(ACTION_GAME_PROVIDE_TESTIMONIALS, {
      userId,
      roomId,
      matchesId,
      options: optionsSetted,
    });
  };

  const hanleClickOptionNotSet = (index: number) => {
    setCurOptionIndex(index === curOptionIndex ? -1 : index);
  };

  const cardItemRender = (card: InfoCardInClient, index: number) => {
    const option = optionsSetted[index];
    return (
      <li className="shrink-0 basis-20" key={index}>
        <InformationCardComponent
          card={card}
          isHidden={phases < Phases.ProvideTestimonials}
          option={option}
          onClickItem={handleCardClick}
        />
      </li>
    );
  };

  const optionItemRender = (option: OptionInClient, index: number) => (
    <Option
      key={option.weight}
      weight={option.weight}
      onClick={hanleClickOptionNotSet.bind(null, index)}
      isSelected={curOptionIndex === index}
    />
  );

  return (
    <>
      {/* 信息卡列表 */}
      <ul className="flex flex-nowrap overflow-x-scroll space-x-2 text-center relative">
        {initInformationCards.map(cardItemRender)}
      </ul>
      {/* 选项物列表 */}
      {canPointOut ? (
        <div className="flex items-center mt-4">
          <ul className="flex flex-1 space-x-2 mr-2">
            {optionsNotSet.map(optionItemRender)}
          </ul>
          <button
            className="ml-auto mr-0 rounded-full rounded-r-none"
            onClick={handleConfirmPointOutInformation}
          >
            确定
          </button>
        </div>
      ) : null}
    </>
  );
};

export default React.memo(InfoCardPane);
