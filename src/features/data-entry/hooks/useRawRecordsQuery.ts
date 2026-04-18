"use client";

import { useEffect, useState } from "react";

import type { RawRecord } from "@/src/types/domain";

type Result = {
  records: RawRecord[];
  isLoading: boolean;
  error: string | null;
};

export function useRawRecordsQuery(
  storeCode: string,
  fiscalYear: number,
  refreshKey = 0,
): Result {
  const [records, setRecords] = useState<RawRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/finance/raw-records?storeCode=${storeCode}&fiscalYear=${fiscalYear}`,
          { signal: controller.signal },
        );

        const data = (await response.json()) as
          | { records: RawRecord[] }
          | { error?: string };

        if (response.status === 404) {
          setRecords([]);
          return;
        }

        if (!response.ok) {
          throw new Error("error" in data && data.error ? data.error : "入力データの取得に失敗しました");
        }

        setRecords(data.records);
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return;
        }

        setRecords([]);
        setError(
          caughtError instanceof Error ? caughtError.message : "入力データの取得に失敗しました",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [storeCode, fiscalYear, refreshKey]);

  return {
    records,
    isLoading,
    error,
  };
}
