"use client";

import { useEffect, useState } from "react";

import { buildStoreConfigViewModel } from "@/src/features/data-entry/lib/build-entry-form-schema";
import type { StoreConfigApiResponse } from "@/src/types/api";
import type { StoreCode } from "@/src/types/domain";

export function useStoreConfigQuery(storeCode: StoreCode) {
  const [stores, setStores] = useState<Array<{ code: StoreCode; name: string }>>([]);
  const [store, setStore] = useState<ReturnType<typeof buildStoreConfigViewModel> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/stores", { signal: controller.signal });
        const data = (await response.json()) as StoreConfigApiResponse | { error?: string };

        if (!response.ok) {
          throw new Error("error" in data && data.error ? data.error : "店舗設定の取得に失敗しました");
        }

        const stores_ = (data as StoreConfigApiResponse).stores;
        const selectedStore = stores_.find((item) => item.code === storeCode);
        if (!selectedStore) {
          throw new Error(`Store config not found: ${storeCode}`);
        }

        setStores(stores_.map((item) => ({ code: item.code, name: item.name })));
        setStore(buildStoreConfigViewModel(selectedStore));
      } catch (caughtError) {
        if (controller.signal.aborted) {
          return;
        }

        setStores([]);
        setStore(null);
        setError(
          caughtError instanceof Error ? caughtError.message : "店舗設定の取得に失敗しました",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => controller.abort();
  }, [storeCode]);

  return {
    store,
    stores,
    fiscalYears: [],
    isLoading,
    error,
  };
}
