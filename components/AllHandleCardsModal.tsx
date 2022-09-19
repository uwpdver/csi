import React, { useState } from "react";
import ReactModal from "react-modal";
import HandCardsPanel, { handCardFilter } from "./HandCardsPanel";
import { useSelector } from 'pages/matches/[...id]';
import { Role } from "@/types/index";
import { default as Header } from './MatchesHeader';

const allFilters: { name: string, filter: handCardFilter }[] = [{
  name: '查看全部',
  filter: 'all',
},
{
  name: '只看手段牌',
  filter: 'measure',
}, {
  name: '只看线索牌',
  filter: 'clue',
}];

const AllHandleCardsModal = ({ children }: { children?: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const playersCanSolve = useSelector(state => state.matches.players.filter((play) => play.role !== Role.Witness));
  const [filterIndex, setFilterIndex] = useState(0);

  const toggleFilter = () => {
    if (filterIndex === 2) {
      setFilterIndex(0)
    } else {
      setFilterIndex(filterIndex + 1)
    }
  }

  return (
    <>
      <ReactModal
        isOpen={isOpen}
        style={{
          content: {
            background: "none",
            display: 'flex',
            flexDirection: 'column',
            border: "none",
            inset: 0,
            padding: '0 16px',
          },
          overlay: {
            zIndex: 99,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            overflowY: 'hidden',
          },
        }}
      >
        <Header>全部手牌</Header>
        <ul className="space-y-2 overflow-y-auto flex-1">
          {playersCanSolve.map((player, index) => (
            <li
              key={player.id}
            >
              <HandCardsPanel
                isSelf={false}
                player={player}
                index={index}
                selectPlayerId={-1}
                filter={allFilters[filterIndex].filter}
              />
            </li>
          ))}
        </ul>
        <div className="h-16 flex items-center justify-end space-x-2">
          <button className="flex-1" onClick={toggleFilter}>{allFilters[(filterIndex + 1) % allFilters.length].name}</button>
          <button className="flex-1" onClick={() => setIsOpen(false)}>关闭</button>
        </div>
      </ReactModal>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) {
          return null
        } else if (child.type === 'button') {
          return React.cloneElement(
            child,
            {
              ...child.props,
              onClick: () => setIsOpen(true)
            },
          )
        } else {
          return child;
        }
      })}
    </>
  );
};

export default AllHandleCardsModal;
