import { prisma } from "@/src/server/db/prisma";
import { importExcelBuffer } from "@/src/server/modules/excel-import/service";

/**
 * POST /api/finance/import-excel
 *
 * ブラウザ経由で Excel を取り込む API。
 * FormData で file（Excel）と fiscalYear（年度）を受け取る。
 *
 * Request: multipart/form-data
 *   - file: Excel ファイル (.xlsx)
 *   - fiscalYear: 年度（数値文字列）
 *
 * Response:
 * {
 *   imported: number,
 *   skipped: number,
 *   skippedDetails: [...],
 *   recalculated: [...]
 * }
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const fiscalYearStr = formData.get("fiscalYear");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Excel ファイルが指定されていません" },
        { status: 400 },
      );
    }

    if (!fiscalYearStr || typeof fiscalYearStr !== "string") {
      return Response.json(
        { error: "fiscalYear が指定されていません" },
        { status: 400 },
      );
    }

    const fiscalYear = parseInt(fiscalYearStr, 10);
    if (isNaN(fiscalYear)) {
      return Response.json(
        { error: "fiscalYear が数値ではありません" },
        { status: 400 },
      );
    }

    // Buffer を直接渡して一時ファイルを経由しない
    // （XLSX.readFile は Next.js webpack バンドル内で fs が利用不可のため）
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importExcelBuffer(
      prisma as any,
      buffer,
      fiscalYear,
      file.name,
    );
    return Response.json(result);
  } catch (error) {
    console.error("[POST /api/finance/import-excel]", error);
    return Response.json(
      { error: "Excel インポートに失敗しました" },
      { status: 500 },
    );
  }
}
