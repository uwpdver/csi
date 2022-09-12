import React from "react";
import Image from "next/image";
import classnames from "classnames";
import { useDispatch, useSelector } from "pages/matches/[...id]";
import { PlayerInClient } from "@/types/client";

export interface Props {
  isSelf: boolean;
  player: PlayerInClient;
  index: number;
  selectPlayerId: number;
}

const HandCardsPanel = ({
  player,
  selectPlayerId,
  index,
  isSelf,
}: Props) => {
  const {
    canSelect,
    selectedMeasure,
    selectedClue,
    selectedPlayerIndex,
    selectFor,
  } = useSelector<{
    canSelect: boolean;
    selectFor: string;
    selectedMeasure: string;
    selectedClue: string;
    selectedPlayerIndex: number;
  }>((state) => ({
    canSelect: state.handCardSelect.canSelect,
    selectFor: state.handCardSelect.selectFor,
    selectedMeasure: state.handCardSelect.selectedMeasure,
    selectedClue: state.handCardSelect.selectedClue,
    selectedPlayerIndex: state.handCardSelect.selectedPlayerIndex,
  }));
  const dispatch = useDispatch();

  const hanldeClickCard = (type: string, name: string) => {
    if (!canSelect) return null;
    if (selectFor === "murder" && !isSelf) {
      alert("只能选择自己的手牌");
      return null;
    }
    dispatch({
      type: "SELECT_HAND_CARD",
      playerId: player.id,
      playerIndex: index,
      selectPlayerId,
      handCardType: type,
      handCardContent: name,
    });
  };

  const isSelected = selectedPlayerIndex === index;

  return (
    <div className="space-y-2 ">
      <div className="flex items-center justify-between">
        <div>{player.user.name}</div>
        <div>剩余{player.remainingNumOfSolveCase}次破案机会</div>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {player.measureCards.map((card, index) => (
          <li
            className={classnames(
              "border border-black rounded-md aspect-[3/4] text-center p-2 bg-red-700 text-white",
              {
                "transition brightness-50":
                  isSelected && card.measureCardName === selectedMeasure,
              }
            )}
            key={index}
            onClick={hanldeClickCard.bind(
              null,
              "measure",
              card.measureCardName
            )}
          >
            <div className="relative w-full aspect-square mb-2">
              <Image
                src="/images/hammer.webp"
                layout="fill"
                objectFit="contain"
                alt=""
              />
            </div>
            <div className="text-xl text-right">{card.measureCard.name}</div>
          </li>
        ))}
      </ul>
      <ul className="grid grid-cols-4 gap-2">
        {player.clueCards.map((card, index) => (
          <li
            key={index}
            className={classnames(
              "border border-black rounded-md aspect-[3/4] text-center p-2 bg-slate-100",
              {
                "transition brightness-50":
                  isSelected && card.clueCardName === selectedClue,
              }
            )}
            onClick={hanldeClickCard.bind(null, "clue", card.clueCardName)}
          >
            <div className="relative w-full aspect-square mb-2">
              <Image
                src="/images/hammer.webp"
                layout="fill"
                objectFit="contain"
                alt=""
              />
            </div>
            <div className="text-xl text-right">{card.clueCard.name}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HandCardsPanel;
