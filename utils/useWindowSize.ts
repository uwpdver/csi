import { useCallback, useEffect, useState } from "react";

interface Size {
  width: number;
  height: number;
}

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState<Size>({
    width: 0,
    height: 0,
  });

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
    return () => {
      window.addEventListener("resize", setSize);
    };
  }, [setSize]);

  return windowSize;
};
