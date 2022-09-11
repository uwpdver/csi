import { Role } from "@/types/index";

const MAX = 10;
const MIN = 4;

export const getRoles = (n: number): Role[] => {
  const roles = [Role.Witness, Role.Murderer, Role.Detective, Role.Detective];
  if (n < MIN) throw new Error("人数不足");
  if (n > MAX) throw new Error("人数过多");
  if (n > 4) roles.push(Role.Detective);
  if (n > 5) roles.push(Role.Accomplice);
  if (n > 6) {
    roles.push(...Array.from<Role>({ length: n - 6 }).fill(Role.Detective));
  }
  return roles;
};
