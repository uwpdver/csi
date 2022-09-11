import { useEffect } from "react";
import { ACTION_CONNECT_ROOM, ACTION_DISCONNECT_ROOM } from "../constants";
import { socket } from "../pages/_app";

export const useConnectToRoom = (roomId: number) => {
  useEffect(() => {
    socket?.emit(ACTION_CONNECT_ROOM, roomId);
    return ()=>{
      socket?.emit(ACTION_DISCONNECT_ROOM, roomId);
    }
  }, [roomId]);
};
