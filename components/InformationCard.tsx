import React from "react";
import classnames from "classnames";
import { InfoCardInClient, OptionInClient } from "@/types/client";
import { InformationCardStatus } from "../types";
import { isEmptyOption } from "@/utils/option";

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
  onClick = () => { },
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
        "info-card-container relative duration-500 transition",
        {
          "translate-y-2":
            !isHidden &&
            status === InformationCardStatus.Show &&
            isEmptyOption(option),
        },
        className
      )}
      style={{
        transform: isHidden ? "rotateY(180deg)" : "",
      }}
    >
      <div className="info-card-face rounded-t-md">
        <div
          className="h-8 leading-8 align-middle info-card-name"
          onClick={onClick.bind(null, orginIndex)}
        >
          {categoryName}
        </div>
        <ul className="divide-y divide-black border-t-black">
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
      <div className="info-card-face info-card-face-back text-4xl font-bold">
        ?
      </div>
    </div>
  );
};

export default React.memo(InformationCard);
