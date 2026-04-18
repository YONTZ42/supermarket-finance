import { z } from "zod";
import { prisma } from "@/src/server/db/prisma";
import { bulkUpsertRawRecords } from "@/src/server/modules/finance/service";
import { getRawRecordsWithCodes } from "@/src/server/modules/finance/repository";

// ---------- schemas ----------

const getRawRecordsSchema = z.object({
  storeCode: z.string(),
  fiscalYear: z.coerce.number().int(),
});

const bulkUpsertSchema = z.object({
  storeCode: z.string(),
  fiscalYear: z.number().int(),
  rows: z.array(
    z.object({
      categoryCode: z.string(),
      valuesByPeriod: z.record(z.string(), z.number()),
    }),
  ),
});

// ---------- handlers ----------

/**
 * GET /api/finance/raw-records?storeCode=TOKYO&fiscalYear=2022
 *
 * 指定店舗・年度の raw records を返す。
 * データ登録画面で既存入力値を表示するために使用。
 *
 * Response:
 * {
 *   records: Array<{
 *     storeCode, fiscalYear, categoryCode,
 *     reportMonth, periodCode, inputModeSnapshot,
 *     rawAmount, sourceType, sourceFileName?
 *   }>
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const raw = {
      storeCode: searchParams.get("storeCode") ?? undefined,
      fiscalYear: searchParams.get("fiscalYear") ?? undefined,
    };

    const parsed = getRawRecordsSchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { error: "storeCode と fiscalYear は必須です", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // storeCode → storeId 解決
    const store = await prisma.store.findUnique({
      where: { code: parsed.data.storeCode },
    });
    if (!store) {
      return Response.json(
        { error: `店舗「${parsed.data.storeCode}」が見つかりません` },
        { status: 404 },
      );
    }

    const records = await getRawRecordsWithCodes(prisma, store.id, parsed.data.fiscalYear);

    return Response.json({
      records: records.map((r) => ({
        storeCode: r.store.code,
        fiscalYear: r.fiscalYear,
        categoryCode: r.category.code,
        reportMonth: r.reportMonth,
        periodCode: r.periodCode,
        inputModeSnapshot: r.inputModeSnapshot,
        rawAmount: Number(r.rawAmount),
        sourceType: r.sourceType,
        ...(r.sourceFileName && { sourceFileName: r.sourceFileName }),
      })),
    });
  } catch (error) {
    console.error("[GET /api/finance/raw-records]", error);
    return Response.json(
      { error: "入力データの取得に失敗しました" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/finance/raw-records
 *
 * フロント SavePayload 形式で一括保存し、正規化・サマリ再計算を実行する。
 *
 * Request body:
 * { storeCode, fiscalYear, rows: [{ categoryCode, valuesByPeriod: { Q1: 1000, ... } }] }
 *
 * Response:
 * { records: RawRecordDTO[], savedAt: string, message: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = bulkUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "入力値が不正です", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await bulkUpsertRawRecords(prisma, parsed.data);
    return Response.json(result);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Record to update not found")
    ) {
      return Response.json(
        { error: "対象の店舗またはカテゴリが見つかりません" },
        { status: 404 },
      );
    }

    console.error("[POST /api/finance/raw-records]", error);
    return Response.json(
      { error: "入力データの保存に失敗しました" },
      { status: 500 },
    );
  }
}
