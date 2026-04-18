"use client";

import { startTransition, useState } from "react";

import type {
  SavePayload,
  SaveProgress,
  SaveResult,
} from "@/src/features/data-entry/types";
import type { UpsertRawRecordResponse } from "@/src/types/api";

export function useRawRecordsMutation() {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState<SaveProgress | null>(null);

  async function save(payload: SavePayload): Promise<SaveResult> {
    const total = payload.rows.length;

    setIsSaving(true);
    setSaveProgress(total > 0 ? { current: 0, total } : null);
    try {
      if (total === 0) {
        const savedAt = new Date().toISOString();
        startTransition(() => {
          setLastSavedAt(savedAt);
        });
        return {
          savedAt,
          records: [],
          message: "保存対象がありません",
        };
      }

      let lastResult: UpsertRawRecordResponse | null = null;

      for (const [index, row] of payload.rows.entries()) {
        const response = await fetch("/api/finance/raw-records", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storeCode: payload.storeCode,
            fiscalYear: payload.fiscalYear,
            rows: [row],
          }),
        });

        const data = (await response.json()) as UpsertRawRecordResponse | { error?: string };
        if (!response.ok) {
          throw new Error(
            "error" in data && data.error ? data.error : "入力データの保存に失敗しました",
          );
        }

        lastResult = data as UpsertRawRecordResponse;

        startTransition(() => {
          setSaveProgress({ current: index + 1, total });
        });
      }

      const result = lastResult ?? {
        savedAt: new Date().toISOString(),
        records: [],
        message: "保存しました",
      };

      startTransition(() => {
        setLastSavedAt(result.savedAt);
      });

      return result;
    } finally {
      startTransition(() => {
        setIsSaving(false);
        setSaveProgress(null);
      });
    }
  }

  return {
    save,
    isSaving,
    lastSavedAt,
    saveProgress,
  };
}
