"use client";

import { useEffect, useState } from "react";

import type { SummaryFilter } from "@/src/features/filters/types";
import { buildSummaryTableData } from "@/src/features/summary/lib/build-summary-table-data";
import type { SummaryRow } from "@/src/features/summary/types";
import type { SummaryApiResponse } from "@/src/types/api";
import type { NormalizedRecord, SummaryRecord } from "@/src/types/domain";

export type SummaryQueryResult = {
  rows: SummaryRow[];
  records: SummaryRecord[];
  normalizedRecords: NormalizedRecord[];
  availableFiscalYears: number[];
  availableStores: Array<{ code: string; name: string }>;
  isLoading: boolean;
  error: string | null;
};

export function useSummaryQuery(filter: SummaryFilter): SummaryQueryResult {
  const [records, setRecords] = useState<SummaryRecord[]>([]);
  const [availableFiscalYears, setAvailableFiscalYears] = useState<number[]>([]);
  const [availableStores, setAvailableStores] = useState<Array<{ code: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);

      const query = new URLSearchParams();
      query.set("fiscalYear", String(filter.fiscalYear));

      if (filter.storeCode !== "ALL") {
        query.set("storeCode", filter.storeCode);
      }

      if (filter.half !== "ALL") {
        query.set("half", filter.half);
      }

      try {
        const response = await fetch(`/api/finance/summary?${query.toString()}`, {
          signal: controller.signal,
        });

        const data = (await response.json()) as SummaryApiResponse | { error?: string };
        if (!response.ok) {
          throw new Error("error" in data && data.error ? data.error : "サマリ取得に失敗しました");
        }

        setRecords(data.records);
        setAvailableFiscalYears(data.availableFiscalYears);
        setAvailableStores(data.availableStores);
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return;
        }

        setRecords([]);
        setAvailableFiscalYears([]);
        setAvailableStores([]);
        setError(
          caughtError instanceof Error ? caughtError.message : "サマリ取得に失敗しました",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [filter]);

  return {
    rows: buildSummaryTableData(records),
    records,
    normalizedRecords: [],
    availableFiscalYears,
    availableStores,
    isLoading,
    error,
  };
}
