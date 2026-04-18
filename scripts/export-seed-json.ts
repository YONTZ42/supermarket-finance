/**
 * DB の現在のデータを JSON で出力するデバッグ用スクリプト。
 *
 * 使い方:
 *   npx tsx scripts/export-seed-json.ts
 *   npx tsx scripts/export-seed-json.ts > seed-snapshot.json
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  try {
    const stores = await prisma.store.findMany({
      include: {
        reportingProfile: true,
        categories: { orderBy: { displayOrder: "asc" } },
      },
      orderBy: { code: "asc" },
    });

    const rawRecords = await prisma.rawRecord.findMany({
      orderBy: [
        { storeId: "asc" },
        { fiscalYear: "asc" },
        { reportMonth: "asc" },
      ],
    });

    const normalizedRecords = await prisma.normalizedRecord.findMany({
      orderBy: [
        { storeId: "asc" },
        { fiscalYear: "asc" },
        { normalizedPeriodCode: "asc" },
      ],
    });

    const summaryRecords = await prisma.summaryRecord.findMany({
      orderBy: [
        { storeId: "asc" },
        { fiscalYear: "asc" },
        { half: "asc" },
      ],
    });

    const output = {
      exportedAt: new Date().toISOString(),
      stores: stores.map((s) => ({
        code: s.code,
        name: s.name,
        inputMode: s.reportingProfile?.inputMode,
        reportMonths: s.reportingProfile?.reportMonths,
        categories: s.categories.map((c) => ({
          code: c.code,
          name: c.name,
          kind: c.kind,
        })),
      })),
      rawRecords: rawRecords.map((r) => ({
        storeId: r.storeId,
        fiscalYear: r.fiscalYear,
        categoryId: r.categoryId,
        reportMonth: r.reportMonth,
        periodCode: r.periodCode,
        rawAmount: r.rawAmount.toString(),
        sourceType: r.sourceType,
      })),
      normalizedRecords: normalizedRecords.map((n) => ({
        storeId: n.storeId,
        fiscalYear: n.fiscalYear,
        categoryId: n.categoryId,
        normalizedPeriodCode: n.normalizedPeriodCode,
        half: n.half,
        amount: n.amount.toString(),
      })),
      summaryRecords: summaryRecords.map((s) => ({
        storeId: s.storeId,
        fiscalYear: s.fiscalYear,
        half: s.half,
        salesTotal: s.salesTotal.toString(),
        expenseTotal: s.expenseTotal.toString(),
        profit: s.profit.toString(),
      })),
    };

    console.log(JSON.stringify(output, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("エクスポートに失敗しました:", e);
  process.exit(1);
});
