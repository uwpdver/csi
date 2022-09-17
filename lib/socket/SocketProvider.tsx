import SocketContext from "./socketContext";
import { useSocketCore } from "./useSocketCore";


export function SocketProvider({ children }: { children?: React.ReactNode }) {
  const socketState = useSocketCore();
  return (
    <SocketContext.Provider value={socketState}>
      {children}
    </SocketContext.Provider>
  );
}

