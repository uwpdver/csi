import { Information, InformationCard } from "@prisma/client";
import shuffle from "lodash.shuffle";

export function pickInfoCards(cards: InformationCard[]) {
  const LEN = 6;
  const result: InformationCard[] = Array.from({ length: LEN });
  const shuffledCards = shuffle(cards);
  let count = 0; // 已经填充的卡数量
  let j = 2; // 场景卡的下标起点
  for (let i = 0; i < shuffledCards.length; i++) {
    const element = shuffledCards[i];
    switch (element.categoryName) {
      case "死亡原因":
        if (!result[0]) {
          result[0] = element;
          count++;
        }
        break;
      case "案发地点":
        if (!result[1]) {
          result[1] = element;
          count++;
        }
        break;
      default:
        // 未填充并且不越数组边界
        if (!result[j] && j < result.length) {
          result[j] = element;
          count++;
          j++;
        }
        break;
    }
  }
  if (count !== LEN) {
    throw new Error("卡池错误");
  }
  return result;
}
