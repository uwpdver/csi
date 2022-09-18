import { useEffect } from "react";
import {
  ACTION_CONNECT_ROOM,
  ACTION_DISCONNECT_ROOM,
} from "@/lib/socket/constants";
import { useSocket } from "@/lib/socket";

export const useConnectToRoom = (roomId: number) => {
  const { isConnected, socket } = useSocket();
  useEffect(() => {
    if (isConnected) {
      socket?.emit(ACTION_CONNECT_ROOM, roomId);
    }
    return () => {
      if (isConnected) {
        socket?.emit(ACTION_DISCONNECT_ROOM, roomId);
      }
    };
  }, [roomId, isConnected]);
};
