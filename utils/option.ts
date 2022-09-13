import { OptionInClient } from "@/types/client";

export const createOption = (weight = 0, indexOnCard = -1): OptionInClient => ({
  weight,
  indexOnCard,
});

export const createEmptyOptions = (n = 0) =>
  Array.from<OptionInClient>({ length: n }).map((_, index) =>
    createOption(index + 1)
  );

export const isEmptyOption = (option: OptionInClient) => option.indexOnCard < 0;
