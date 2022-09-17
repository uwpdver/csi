import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { ConnectState, ISocket } from "./types";

export function useSocketCore(): ConnectState {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<ISocket>(null);
  useEffect(() => {
    (async () => {
      if (typeof window === "undefined") return;
      try {
        setIsConnecting(true);
        await fetch("/api/socket");
        const socket = io();
        socket.on("connect", () => {
          setIsConnected(true);
        });
        socket.on("disconnect", () => {
          setIsConnected(false);
        });
        setSocket(socket);
      } catch (error) {
        console.log(error);
      } finally {
        setIsConnecting(false);
      }
    })();
  }, []);
  return { isConnecting, isConnected, socket };
}
