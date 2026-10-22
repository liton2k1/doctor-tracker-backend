export type TTimelineInterval = "day" | "month";

export interface TTimelineQuery {
  interval: TTimelineInterval;
  from?: Date;
  to?: Date;
}

export interface TLimitQuery {
  limit: number;
}

export interface TTimelinePoint {
  date: string;
  doctors: number;
  patients: number;
}

export interface TDistributionItem {
  label: string;
  count: number;
}
