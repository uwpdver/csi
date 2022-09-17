import React from 'react'
import { ConnectState } from "./types";

const SocketContext = React.createContext<ConnectState>({
  isConnecting: false,
  isConnected: false,
  socket: null,
});

export default SocketContext;
