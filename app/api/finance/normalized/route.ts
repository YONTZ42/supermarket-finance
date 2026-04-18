import { z } from "zod";
import { prisma } from "@/src/server/db/prisma";
import { getNormalizedSummary } from "@/src/server/modules/finance/service";

const querySchema = z.object({
  fiscalYear: z.coerce.number().int().optional(),
  storeCode: z.string().optional(),
  half: z.enum(["H1", "H2"]).optional(),
});

/**
 * GET /api/finance/normalized?fiscalYear=2022&storeCode=TOKYO&half=H1
 *
 * normalized_records を返す。
 * 全パラメータ任意。指定なしで全件返却。
 *
 * Response:
 * {
 *   records: Array<{ storeCode, storeName, fiscalYear, half, categoryCode, categoryName, kind, periodCode, amount }>
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

    const parsed = querySchema.safeParse(raw);
    if (!parsed.success) {
      return Response.json(
        { error: "不正なクエリパラメータです", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await getNormalizedSummary(prisma, parsed.data);
    return Response.json(result);
  } catch (error) {
    console.error("[GET /api/finance/normalized]", error);
    return Response.json(
      { error: "正規化レコードの取得に失敗しました" },
      { status: 500 },
    );
  }
}
