/**
 * Excel ファイルから raw_records を取り込む CLI スクリプト。
 *
 * 使い方:
 *   npx tsx scripts/import-excel.ts <ファイルパス> <年度>
 *
 * 例:
 *   npx tsx scripts/import-excel.ts ./data/financial_data.xlsx 2022
 *
 * 前提:
 *   - DB にマスタデータ（stores, categories, reporting profiles）が投入済みであること
 *   - Excel のシート名が店舗名（東京, 大阪, 名古屋）または店舗コード（TOKYO 等）であること
 *   - シートのヘッダー行に "3月", "6月" 等の形式で報告月が記載されていること
 *   - データ行の第1列がカテゴリ名であること
 */
import { PrismaClient } from "@prisma/client";
import { importExcelFile } from "@/src/server/modules/excel-import/service";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("使い方: npx tsx scripts/import-excel.ts <ファイルパス> <年度>");
    console.error("例:     npx tsx scripts/import-excel.ts ./data/financial_data.xlsx 2022");
    process.exit(1);
  }

  const filePath = args[0];
  const fiscalYear = parseInt(args[1], 10);

  if (isNaN(fiscalYear)) {
    console.error(`エラー: 年度「${args[1]}」が数値ではありません`);
    process.exit(1);
  }

  console.log(`Excel インポート開始: ${filePath} (年度: ${fiscalYear})`);

  const prisma = new PrismaClient();

  try {
    const result = await importExcelFile(prisma, filePath, fiscalYear);

    console.log(`\n--- 結果 ---`);
    console.log(`取り込み: ${result.imported} 件`);
    console.log(`スキップ: ${result.skipped} 件`);
    console.log(`再計算:   ${result.recalculated.join(", ") || "なし"}`);

    if (result.skippedDetails.length > 0) {
      console.log(`\n--- スキップ詳細 ---`);
      for (const s of result.skippedDetails) {
        console.log(`  [${s.sheetName}] ${s.rowLabel} (${s.reportMonth}月): ${s.reason}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("インポートに失敗しました:", e);
  process.exit(1);
});
