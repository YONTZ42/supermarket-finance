"use client";

import { startTransition, useState } from "react";

import type { SavePayload, SaveResult } from "@/src/features/data-entry/types";
import type { UpsertRawRecordResponse } from "@/src/types/api";

export function useRawRecordsMutation() {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  async function save(payload: SavePayload): Promise<SaveResult> {
    setIsSaving(true);
    try {
      const response = await fetch("/api/finance/raw-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as UpsertRawRecordResponse | { error?: string };
      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : "入力データの保存に失敗しました");
      }

      startTransition(() => {
        setLastSavedAt(data.savedAt);
      });

      return data;
    } finally {
      startTransition(() => {
        setIsSaving(false);
      });
    }
  }

  return {
    save,
    isSaving,
    lastSavedAt,
  };
}
