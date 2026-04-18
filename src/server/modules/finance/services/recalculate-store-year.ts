import type { PrismaClient } from "@prisma/client";
import type { PeriodDefinition } from "@/src/server/modules/store-config/types";
import { normalizeRawRecords } from "../normalizers/normalize-raw-records";
import { buildHalfSummaries } from "../normalizers/build-summary";
import {
  getRawRecords,
  deleteNormalizedRecords,
  createNormalizedRecords,
  deleteSummaryRecords,
  createSummaryRecord,
} from "../repository";
import { logRecalculate } from "@/src/server/modules/audit/service";

type RecalculateParams = {
  storeId: string;
  fiscalYear: number;
};

/**
 * 指定店舗・年度の raw_records をもとに
 * normalized_records と summary_records を再生成する。
 *
 * 処理フロー:
 *   1. Read  — reporting profile / raw records / categories 取得
 *   2. Compute — inputMode + periodDefinitions に基づき正規化 → 半期サマリ算出
 *   3. Write — トランザクション内で旧データ削除 → 新データ書き込み → 監査ログ
 */
export async function recalculateStoreYear(
  prisma: PrismaClient,
  params: RecalculateParams,
): Promise<void> {
  const { storeId, fiscalYear } = params;

  // ===== 1. Read phase =====

  const profile = await prisma.storeReportingProfile.findUniqueOrThrow({
    where: { storeId },
  });
  const periodDefinitions = profile.periodDefinitions as PeriodDefinition[];

  const rawRecords = await getRawRecords(prisma, storeId, fiscalYear);

  const categories = await prisma.category.findMany({
    where: { storeId, isActive: true },
  });
  const categoryKindMap = new Map(categories.map((c) => [c.id, c.kind]));

  // ===== 2. Compute phase (pure) =====

  const normalizedInputs = normalizeRawRecords(
    rawRecords,
    profile.inputMode as "CUMULATIVE" | "PERIODIC",
    periodDefinitions,
    storeId,
    fiscalYear,
  );

  const summaryByHalf = buildHalfSummaries(normalizedInputs, categoryKindMap);

  // ===== 3. Write phase (transactional) =====

  await prisma.$transaction(
    async (tx) => {
      // 旧データ削除
      await deleteNormalizedRecords(tx, storeId, fiscalYear);
      await deleteSummaryRecords(tx, storeId, fiscalYear);

      // normalized_records 作成
      await createNormalizedRecords(tx, normalizedInputs);

      // summary_records 作成
      for (const [half, totals] of summaryByHalf) {
        await createSummaryRecord(tx, {
          storeId,
          fiscalYear,
          half,
          salesTotal: totals.salesTotal,
          expenseTotal: totals.expenseTotal,
          profit: totals.salesTotal.sub(totals.expenseTotal),
        });
      }

      // 監査ログ
      await logRecalculate(tx, {
        storeId,
        fiscalYear,
        afterValue: {
          normalizedCount: normalizedInputs.length,
          summaries: [...summaryByHalf.entries()].map(([h, t]) => ({
            half: h,
            salesTotal: t.salesTotal.toString(),
            expenseTotal: t.expenseTotal.toString(),
            profit: t.salesTotal.sub(t.expenseTotal).toString(),
          })),
        },
      });
    },
    { timeout: 30000 },
  );
}
