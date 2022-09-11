import React from "react";
import Image from "next/image";
import classnames from "classnames";
import {
  User,
  MeasureCardsOnPlayers,
  ClueCardsOnPlayers,
  Player,
  MeasureCard,
  ClueCard,
} from "@prisma/client";

export interface Props {
  player: Player & {
    user: User;
    measureCards: (MeasureCardsOnPlayers & {
      measureCard: MeasureCard;
    })[];
    clueCards: (ClueCardsOnPlayers & {
      clueCard: ClueCard;
    })[];
  };
  canSelect: boolean;
  selectedMeasure?: string;
  selectedClue?: string;
  onClickCard?(data: { playerId: number; type: string; name: string }): void;
  isSelected?: boolean;
}

const HandCardsPanel = ({
  player,
  canSelect,
  selectedMeasure = "",
  selectedClue = "",
  onClickCard = () => {},
  isSelected = false,
}: Props) => {
  const hanldeClickCard = (type: string, name: string) => {
    canSelect &&
      onClickCard({
        type,
        name,
        playerId: player.id,
      });
  };
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
