import type { RawRecord, StoreConfig, SummaryRecord } from "@/src/types/domain";

export type SummaryApiResponse = {
  records: SummaryRecord[];
  availableFiscalYears: number[];
  availableStores: Array<Pick<StoreConfig, "code" | "name">>;
};

export type StoreConfigApiResponse = {
  stores: StoreConfig[];
};

export type UpsertRawRecordResponse = {
  records: RawRecord[];
  savedAt: string;
  message: string;
};
