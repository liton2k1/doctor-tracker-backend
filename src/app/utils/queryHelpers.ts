export const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildSearchRegex = (term: string) =>
  new RegExp(escapeRegex(term), "i");

export const buildDateRange = (from?: Date, to?: Date) => {
  if (!from && !to) return undefined;

  const range: { $gte?: Date; $lte?: Date } = {};
  if (from) range.$gte = from;
  if (to) {
    const end = new Date(to);
    end.setUTCHours(23, 59, 59, 999);
    range.$lte = end;
  }
  return range;
};

export const sortDirection = (order: "asc" | "desc"): 1 | -1 =>
  order === "asc" ? 1 : -1;
