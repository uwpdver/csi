import { useCallback, useEffect, useState } from "react";

interface Size {
  width: number;
  height: number;
}

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState<Size>({ width: 0, height: 0 });

  const setSize = useCallback(
    () =>
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      }),
    []
  );

  useEffect(() => {
    setSize();
    window.addEventListener("resize", setSize);
    return () => {
      window.removeEventListener("resize", setSize);
    };
  }, [setSize]);

  return windowSize;
};
