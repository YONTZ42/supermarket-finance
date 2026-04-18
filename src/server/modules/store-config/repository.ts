import type { DbClient } from "@/src/server/db/prisma";
import type { PeriodDefinition } from "./types";

/** store + reporting profile + categories をまとめて取得 */
export async function getStoreWithProfile(db: DbClient, storeId: string) {
  const store = await db.store.findUniqueOrThrow({
    where: { id: storeId },
    include: {
      reportingProfile: true,
      categories: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
    },
  });

  return store;
}

/** reporting profile から型付き periodDefinitions を取得 */
export async function getReportingProfile(db: DbClient, storeId: string) {
  const profile = await db.storeReportingProfile.findUniqueOrThrow({
    where: { storeId },
  });

  return {
    ...profile,
    periodDefinitions: profile.periodDefinitions as PeriodDefinition[],
  };
}

/** 全店舗一覧を取得 */
export async function listStores(db: DbClient) {
  return db.store.findMany({
    where: { isActive: true },
    include: {
      reportingProfile: true,
      categories: { where: { isActive: true }, orderBy: { displayOrder: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });
}
