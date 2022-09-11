import React from "react";
import classnames from "classnames";
import { InformationCardStatus } from "@/types/index";

interface Props {
  isHidden?: boolean;
  list: { content: string }[];
  option?: { weight: number; indexOnCard: number };
  categoryName: string;
  status: InformationCardStatus;
  index: number;
  onClickItem(index: number, subIndex: number): void;
  onClick?(index: number): void;
}

const InformationCard = ({
  isHidden,
  list,
  index,
  option,
  status,
  categoryName,
  onClickItem,
  onClick = () => {},
}: Props) => {
  return (
    <div
      className={classnames(
        "border border-black rounded-md overflow-hidden bg-yellow-400 relative",
        { "transition grayscale-[.8]": status === InformationCardStatus.Discard }
      )}
    >
      {isHidden && (
        <div className=" absolute top-0 left-0 w-full h-full bg-yellow-400 text-white flex items-center justify-center text-4xl font-bold z-10">
          ?
        </div>
      )}
      <div className="bg-black text-white" onClick={() => onClick(index)}>
        {categoryName}
      </div>
      <ul className="divide-y divide-black border-t border-t-black">
        {list.map((info, subIndex) => (
          <li
            key={subIndex}
            className={classnames("relative overflow-hidden", {
              "bg-red-600 text-white": subIndex === option?.indexOnCard,
            })}
            onClick={onClickItem.bind(null, index, subIndex)}
          >
            {subIndex === option?.indexOnCard ? (
              <div className="absolute left-1 top-50 transform -translate-y-50 bottom-0 opacity-75 text-xl font-bold">
                {option?.weight}
              </div>
            ) : null}
            <div>{info.content}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InformationCard;
