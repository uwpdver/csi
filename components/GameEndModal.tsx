import React from 'react';
import ReactModal from 'react-modal';
import Image from 'next/image';
import { useRouter } from 'next/router';
import classnames from 'classnames';
import { Phases } from '@/types/index';
import { useSocket } from '@/lib/socket';
import { useSelector } from 'pages/matches/[...id]';
import { ACTION_GAME_QUIT } from '@/lib/socket/constants';

const GameEndModal = () => {
  const { socket } = useSocket();
  const router = useRouter()
  const phases = useSelector(state => state.matches.phases);
  const measure = useSelector(state => state.matches.measure);
  const clue = useSelector(state => state.matches.clue);
  const murderName = useSelector(state => state.computed.murder?.user.name);
  const selfPlayerId = useSelector(state => state.computed.self?.id);
  const matchesId = useSelector(state => state.matches.id);
  const roomId = useSelector(state => state.matches.roomId);

  const handleQuitMatchesBtnClick = () => {
    if (selfPlayerId) {
      socket?.emit(ACTION_GAME_QUIT, selfPlayerId, roomId, matchesId);
    }
    router.replace(`/room/${roomId}`);
  };

  return (
    <ReactModal
      isOpen={phases === Phases.MurdererWin || phases === Phases.DetectiveWin}
      style={{
        content: {
          background: "none",
          border: "none",
          inset: 0,
        },
        overlay: {
          backgroundColor: "rgba(0,0,0,0.75)",
          zIndex: 99,
          backdropFilter: "blur(4px)",
        },
      }}
    >
      <div className="text-center">
        <div className="m-4 text-yellow-100 text-xl -mb-8">
          <div>{`凶手是：${murderName}`}</div>
          <div>{`选择了：【${measure}】和【${clue}】`}</div>
        </div>
        <Image
          src="/images/confetti_ball_3d.png"
          alt=""
          width={200}
          height={200}
        />
        <Image
          src={
            Phases.DetectiveWin === phases
              ? "/images/detective_3d_default.png"
              : "/images/bust_in_silhouette_3d.png"
          }
          alt=""
          width={200}
          height={200}
          objectFit="contain"
        />
        <div
          className={classnames(
            "text-3xl text-yellow-100 h-16 rounded-full flex items-center font-bold justify-center w-fit mx-auto px-10 -mt-5 min-w-[240px]",
            {
              "bg-blue-400": Phases.DetectiveWin === phases,
              "bg-gray-800": Phases.DetectiveWin !== phases,
            }
          )}
        >
          {Phases.DetectiveWin === phases ? "侦探胜利" : "凶手胜利"}
        </div>
        <button
          className="mt-4 h-16 min-w-[240px] rounded-full text-2xl"
          onClick={handleQuitMatchesBtnClick}
        >
          退出对局
        </button>
      </div>
    </ReactModal>
  )
}

export default GameEndModal;