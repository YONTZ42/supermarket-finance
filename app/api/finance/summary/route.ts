import { z } from "zod";
import { prisma } from "@/src/server/db/prisma";
import { getSummary } from "@/src/server/modules/finance/service";

const summaryQuerySchema = z.object({
  fiscalYear: z.coerce.number().int().optional(),
  storeCode: z.string().optional(),
  half: z.enum(["H1", "H2"]).optional(),
});

/**
 * GET /api/finance/summary?fiscalYear=2022&storeCode=TOKYO&half=H1
 *
 * サマリ画面用データを返す。
 * 全パラメータ任意。指定なしで全件返却。
 *
 * Response:
 * {
 *   records: Array<{ storeCode, storeName, fiscalYear, half, salesTotal, expenseTotal, profit }>,
 *   availableFiscalYears: number[],
 *   availableStores: Array<{ code, name }>
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const raw = {
      fiscalYear: searchParams.get("fiscalYear") ?? undefined,
      storeCode: searchParams.get("storeCode") ?? undefined,
      half: searchParams.get("half") ?? undefined,
    };

    const parsed = summaryQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { error: "不正なクエリパラメータです", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await getSummary(prisma, parsed.data);
    return Response.json(result);
  } catch (error) {
    console.error("[GET /api/finance/summary]", error);
    return Response.json(
      { error: "サマリの取得に失敗しました" },
      { status: 500 },
    );
  }
}
