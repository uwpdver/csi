import React, { useState } from "react";
import ReactModal from "react-modal";
import HandCardsPanel, { handCardFilter } from "./HandCardsPanel";
import { useSelector } from 'pages/matches/[...id]';
import { Role } from "@/types/index";

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
      <ReactModal isOpen={isOpen}
        style={{
          content: {
            background: "none",
            border: "none",
            inset: 0,
          },
          overlay: {
            zIndex: 99,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(4px)',
            overflowY: 'hidden',
          },
        }}>
        <ul className="space-y-2  mb-16">
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
        <div className="h-16 fixed bottom-0 left-0 right-0 flex items-center justify-center space-x-4">
          <button onClick={toggleFilter}>{allFilters[(filterIndex + 1) % allFilters.length].name}</button>
          <button onClick={()=>setIsOpen(false)}>关闭</button>
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
