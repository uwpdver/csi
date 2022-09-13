import * as matches from "./matches";

export type Action<T = string, P = {}> = {
  type: T;
  [key: string]: any;
} & P;

const reducers = {
  matches,
};

export default reducers;
