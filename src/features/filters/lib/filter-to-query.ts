import type { SummaryFilter } from "@/src/features/filters/types";

export function summaryFilterToQuery(filter: SummaryFilter) {
  const query = new URLSearchParams();
  query.set("fiscalYear", String(filter.fiscalYear));
  query.set("storeCode", filter.storeCode);
  query.set("half", filter.half);
  query.set("metric", filter.metric);
  query.set("compareBy", filter.compareBy);
  query.set("chartType", filter.chartType);
  return query;
}
