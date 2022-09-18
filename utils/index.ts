export const getFirstQueryParmse = (q: string | string[] | undefined) => {
  if (typeof q === "undefined") return "";
  if (Array.isArray(q)) return q.length > 0 ? q[0] : "";
  return q;
};

export function isAsync(fn: Function) {
  return fn.constructor.name === "AsyncFunction";
}
