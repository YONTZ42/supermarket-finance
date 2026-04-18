"use client";

import { useEffect, useState } from "react";

import type { SummaryFilter } from "@/src/features/filters/types";
import type { NormalizedApiResponse } from "@/src/types/api";
import type { NormalizedRecord } from "@/src/types/domain";

export type NormalizedQueryResult = {
  records: NormalizedRecord[];
  isLoading: boolean;
  error: string | null;
};

export function useNormalizedQuery(filter: SummaryFilter): NormalizedQueryResult {
  const [records, setRecords] = useState<NormalizedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);

      const query = new URLSearchParams();
      if (filter.fiscalYear !== "ALL") query.set("fiscalYear", String(filter.fiscalYear));
      if (filter.storeCode !== "ALL") query.set("storeCode", filter.storeCode);
      if (filter.half !== "ALL") query.set("half", filter.half);

      try {
        const response = await fetch(`/api/finance/normalized?${query.toString()}`, {
          signal: controller.signal,
        });

        const data = (await response.json()) as NormalizedApiResponse | { error?: string };
        if (!response.ok) {
          throw new Error("error" in data && data.error ? data.error : "正規化レコード取得に失敗しました");
        }

        // API returns NormalizedDTO which maps to NormalizedRecord (reportMonth is not used in summary)
        setRecords((data as NormalizedApiResponse).records);
      } catch (err) {
        if (controller.signal.aborted) return;
        setRecords([]);
        setError(err instanceof Error ? err.message : "正規化レコード取得に失敗しました");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [filter]);

  return { records, isLoading, error };
}
