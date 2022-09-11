import classnames from "classnames";
import { useState, useEffect } from "react";
import {
  Information,
  InformationCard,
  InformationCardsOnMatches,
} from "@prisma/client";
import { default as InformationCardComponent } from "./InformationCard";
import { OptionInClient } from "@/types/client";

export interface Props {
  informationCards: (InformationCardsOnMatches & {
    informationCard: InformationCard & {
      list: Information[];
    };
  })[];
  defaultOptions: OptionInClient[];
  isHidden?: boolean;
  isPointOutInfo?: boolean;
  onComfirm(options: OptionInClient[]): void;
}

const InfoCardPane = ({
  isHidden,
  defaultOptions,
  informationCards,
  isPointOutInfo,
  onComfirm,
}: Props) => {
  const [optionsSetted, setOptionsSetted] = useState<OptionInClient[]>(
    defaultOptions.length > 0
      ? defaultOptions
      : Array.from<OptionInClient>({ length: 6 }).fill({
          weight: 0,
          indexOnCard: -1,
        })
  );
  const [optionsNotSet, setOptionsNotset] = useState(
    Array.from({ length: 6 }).map((_, index) => ({
      weight: index + 1,
      indexOnCard: -1,
    }))
  );
  const [curOptionIndex, setCurOptionIndex] = useState(-1);

  useEffect(() => {
    if (defaultOptions.length > 0) {
      setOptionsNotset([]);
      setOptionsSetted(defaultOptions);
    }
  }, [defaultOptions]);

  const handleClickItem = (index: number, subIndex: number) => {
    if (!isPointOutInfo) {
      return null;
    }
    const optionSetted = optionsSetted[index];
    const optionNotSet = optionsNotSet[curOptionIndex];
    const copyOptionsSetted = [...optionsSetted];
    const copyOptionsNotSet = [...optionsNotSet];
    copyOptionsSetted[index] = optionNotSet
      ? {
          weight: optionNotSet.weight,
          indexOnCard: subIndex,
        }
      : {
          weight: 0,
          indexOnCard: -1,
        };
    if (optionNotSet) copyOptionsNotSet.splice(curOptionIndex, 1);
    if (optionSetted.weight !== 0) {
      copyOptionsNotSet.push({
        weight: optionSetted.weight,
        indexOnCard: -1,
      });
    }
    setOptionsSetted(copyOptionsSetted);
    setOptionsNotset(copyOptionsNotSet);
    setCurOptionIndex(-1);
  };

  const handleConfirmPointOutInformation = () => {
    if (
      optionsSetted.length !== 6 ||
      optionsSetted.some((option) => option.weight === 0)
    ) {
      return;
    }
    onComfirm(optionsSetted);
  };

  const hanleClickOptionNotSet = (index: number) => {
    setCurOptionIndex(index === curOptionIndex ? -1 : index);
  };

  return (
    <>
      <ul className="flex flex-nowrap overflow-x-scroll space-x-2 text-center relative">
        {informationCards.map((card, index) => {
          const option = optionsSetted[index];
          return (
            <li className="shrink-0 basis-20" key={index}>
              <InformationCardComponent
                status={card.status}
                isHidden={isHidden}
                index={index}
                option={option}
                categoryName={card.informationCard.categoryName}
                list={card.informationCard.list}
                onClickItem={handleClickItem}
              />
            </li>
          );
        })}
      </ul>
      {isPointOutInfo ? (
        <div className="flex items-center mt-4">
          <ul className="flex flex-1 space-x-2 mr-2">
            {optionsNotSet.map((option, index) => (
              <li
                key={option.weight}
                onClick={hanleClickOptionNotSet.bind(null, index)}
                className={classnames(
                  "bg-red-600 border border-black h-10 w-10 rounded-full flex items-center justify-center font-bold text-xl text-white",
                  {
                    "bg-red-300": curOptionIndex === index,
                  }
                )}
              >
                {option.weight}
              </li>
            ))}
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

export default InfoCardPane;
