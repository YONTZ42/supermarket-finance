import type { DbClient } from "@/src/server/db/prisma";
import { listStores, getStoreWithProfile } from "./repository";

/**
 * フロント表示用に整形した店舗一覧を返す。
 * フロント domain.StoreConfig 型に合わせた shape で返す。
 */
export async function getStoreConfigs(db: DbClient) {
  const stores = await listStores(db);

  return stores.map((store) => formatStoreConfig(store));
}

/** 単一店舗の設定を返す */
export async function getStoreConfig(db: DbClient, storeId: string) {
  const store = await getStoreWithProfile(db, storeId);
  return formatStoreConfig(store);
}

/** code で店舗検索して設定を返す */
export async function getStoreConfigByCode(db: DbClient, storeCode: string) {
  const store = await db.store.findUniqueOrThrow({
    where: { code: storeCode },
    include: {
      reportingProfile: true,
      categories: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
    },
  });
  return formatStoreConfig(store);
}

// ---------- helpers ----------

function formatStoreConfig(store: {
  id: string;
  code: string;
  name: string;
  reportingProfile: {
    inputMode: string;
    fiscalYearStartMonth: number;
    reportMonths: number[];
    periodDefinitions: unknown;
  } | null;
  categories: Array<{
    id: string;
    code: string;
    name: string;
    kind: string;
    displayOrder: number;
  }>;
}) {
  return {
    id: store.id,
    code: store.code,
    name: store.name,
    inputMode: store.reportingProfile?.inputMode ?? null,
    fiscalYearStartMonth: store.reportingProfile?.fiscalYearStartMonth ?? 1,
    reportMonths: store.reportingProfile?.reportMonths ?? [],
    periodDefinitions: store.reportingProfile?.periodDefinitions ?? [],
    categories: store.categories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      kind: c.kind,
      displayOrder: c.displayOrder,
    })),
  };
}
