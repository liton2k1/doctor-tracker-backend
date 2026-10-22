import { TMeta } from "../interfaces/query.types";

export const getSkip = (page: number, limit: number) => (page - 1) * limit;

export const buildMeta = (
  total: number,
  page: number,
  limit: number,
): TMeta => ({
  page,
  limit,
  total,
  totalPage: Math.ceil(total / limit),
});
