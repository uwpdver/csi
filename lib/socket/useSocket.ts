import { useContext } from "react";
import SocketContext from "./socketContext";
import { ConnectState } from "./types";

export function useSocket(): ConnectState {
  return useContext(SocketContext);
}
