import * as matches from "./matches";
import * as replenishPane from "./replenishPane";

export type Action<T = string, P = {}> = {
  type: T;
  [key: string]: any;
} & P;

const reducers = {
  matches,
  replenishPane,
};

export default reducers;
