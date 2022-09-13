import React, { useEffect, useState } from "react";

export const useCountDown = (): [
  number,
  React.Dispatch<React.SetStateAction<number>>
] => {
  const [countDown, setCountDown] = useState(0);

  useEffect(() => {
    let timeoutHandle: any = null;
    if (countDown > 0) {
      timeoutHandle = setTimeout(() => {
        setCountDown(Math.max(countDown - 1, 0));
      }, 1000);
    }
    return () => {
      clearTimeout(timeoutHandle);
    };
  }, [countDown]);

  return [countDown, setCountDown];
};
