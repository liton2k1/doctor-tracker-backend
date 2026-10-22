export interface TMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface TPaginationQuery {
  page: number;
  limit: number;
  sortOrder: "asc" | "desc";
}

export interface TDateRangeQuery {
  from?: Date;
  to?: Date;
}
