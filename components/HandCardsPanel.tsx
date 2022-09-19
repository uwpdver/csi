import React from "react";
import { useDispatch, useSelector } from "pages/matches/[...id]";
import HandCard from "./HandCard";
import {
  ClueCardInClient,
  MeasureCardInClient,
  PlayerInClient,
} from "@/types/client";

export type handCardFilter = 'measure' | 'clue' | 'all'

export interface Props {
  isSelf: boolean;
  player: PlayerInClient;
  index: number;
  selectPlayerId: number;
  filter?: handCardFilter;
}

const HandCardsPanel = ({ player, selectPlayerId, index, isSelf, filter = 'all' }: Props) => {
  const {
    canSelect,
    selectedMeasure,
    selectedClue,
    isPlayerSelected,
    selectFor,
  } = useSelector((state) => ({
    canSelect: state.handCardSelect.canSelect,
    selectFor: state.handCardSelect.selectFor,
    selectedMeasure: state.handCardSelect.selectedMeasure,
    selectedClue: state.handCardSelect.selectedClue,
    selectedPlayerIndex: state.handCardSelect.selectedPlayerIndex,
    isPlayerSelected: state.handCardSelect.selectedPlayerIndex === index,
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

  // 手法牌
  const measureCardItemRender = ({ measureCardName }: MeasureCardInClient) => (
    <HandCard
      key={measureCardName}
      className="measure-card"
      name={measureCardName}
      onClick={hanldeClickCard.bind(null, "measure", measureCardName)}
      isHighlight={!canSelect || (isPlayerSelected && measureCardName === selectedMeasure)}
    />
  );

  // 线索牌
  const clueCardItemRender = (
    { clueCardName }: ClueCardInClient,
    index: number
  ) => (
    <HandCard
      key={clueCardName}
      className="clue-card"
      name={clueCardName}
      onClick={hanldeClickCard.bind(null, "clue", clueCardName)}
      isHighlight={!canSelect || (isPlayerSelected && clueCardName === selectedClue)}
    />
  );

  return (
    <div className="space-y-2 ">
      <div className="flex items-center justify-between">
        <div>{player.user.name}</div>
        <div>剩余{player.remainingNumOfSolveCase}次破案机会</div>
      </div>
      {filter === 'clue' || <ul className="grid grid-cols-4 gap-2">
        {player.measureCards.map(measureCardItemRender)}
      </ul>}
      {filter === 'measure' || <ul className="grid grid-cols-4 gap-2">
        {player.clueCards.map(clueCardItemRender)}
      </ul>}
    </div>
  );
};

export default React.memo(HandCardsPanel);
