import React, { useRef } from "react";

export const useListRef = <T = HTMLElement | null>(
  initValue: T[] = []
): [T[], (index: number, ref: T) => void] => {
  const listRef = useRef<T[]>(initValue);
  const appendToListRef = (index: number, ref: T) => {
    if (listRef && Array.isArray(listRef.current)) {
      listRef.current[index] = ref;
    }
  };
  return [listRef.current, appendToListRef];
};
