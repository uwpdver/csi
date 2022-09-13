import React from "react";
import classnames from "classnames";
import { InfoCardInClient, OptionInClient } from "@/types/client";
import { InformationCardStatus } from "../types";

interface Props {
  card: InfoCardInClient;
  isHidden?: boolean;
  option?: OptionInClient;
  className?: string;
  onClickItem(orginIndex: number, subIndex: number): void;
  onClick?(orginIndex: number): void;
}

const InformationCard = ({
  card,
  isHidden,
  option,
  className = "",
  onClickItem,
  onClick = () => {},
}: Props) => {
  const {
    status,
    order,
    informationCard: { categoryName, list },
  } = card;
  const orginIndex = order - 1;
  return (
    <div
      className={classnames(
        "overflow-hidden bg-[#eed7b3] relative font-serif rounded-md shadow-md border border-black",
        className,
        {
          "transition grayscale-[.8]": status === InformationCardStatus.Discard,
        }
      )}
    >
      {isHidden && (
        <div className=" absolute top-0 left-0 w-full h-full bg-[#eed7b3] flex items-center justify-center text-4xl font-bold z-10">
          ?
        </div>
      )}
      <div
        className="bg-black text-white h-8 leading-8 align-middle"
        onClick={onClick.bind(null, orginIndex)}
      >
        {categoryName}
      </div>
      <ul className="divide-y divide-black">
        {list.map((info, subIndex) => {
          const hasOption = subIndex === option?.indexOnCard;
          return (
            <li
              key={subIndex}
              className={classnames(
                "relative overflow-hidden h-8 leading-8 align-middle",
                {
                  "bg-red-700 text-white": hasOption,
                }
              )}
              onClick={onClickItem.bind(null, orginIndex, subIndex)}
            >
              {hasOption ? (
                <div className="absolute left-1 top-50 transform -translate-y-50 opacity-75 text-xl font-bold">
                  {option?.weight}
                </div>
              ) : null}
              <div>{info.content}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default React.memo(InformationCard);
