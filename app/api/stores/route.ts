import { prisma } from "@/src/server/db/prisma";
import { getStoreConfigs } from "@/src/server/modules/store-config/service";

/**
 * GET /api/stores
 *
 * 店舗一覧と設定情報（reporting profile + categories）を返す。
 *
 * Response:
 * {
 *   stores: Array<{
 *     id, code, name, inputMode,
 *     reportMonths, periodDefinitions,
 *     categories: { sales: [...], expense: [...] }
 *   }>
 * }
 */
export async function GET() {
  try {
    const stores = await getStoreConfigs(prisma);
    return Response.json({ stores });
  } catch (error) {
    console.error("[GET /api/stores]", error);
    return Response.json(
      { error: "店舗情報の取得に失敗しました" },
      { status: 500 },
    );
  }
}
