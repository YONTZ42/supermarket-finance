import type { SummaryRow } from "@/src/features/summary/types";
import type { SummaryRecord } from "@/src/types/domain";

export function buildSummaryTableData(records: SummaryRecord[]): SummaryRow[] {
  return records.map((record) => ({
    ...record,
    marginRate: record.salesTotal === 0 ? 0 : (record.profit / record.salesTotal) * 100,
  }));
}
