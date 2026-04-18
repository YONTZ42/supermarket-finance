/**
 * generate-import-xlsx.mjs
 *
 * public/default-data/material.xlsx を読み込み、
 * import-excel が受け付ける形式に整形した年度別ファイルを
 * public/default-data/ に出力する。
 *
 * 出力: import-2022.xlsx, import-2023.xlsx, import-2024.xlsx
 *
 * import-excel が期待するシートフォーマット:
 *   行0: ["", "3月", "6月", ...]        ← ヘッダー（月のみ）
 *   行1+: ["カテゴリ名", 数値, 数値, ...] ← カテゴリ名はDBのname列と完全一致
 *
 * シート名: 東京 / 大阪 / 名古屋（DBのstore.nameと一致）
 */

import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const srcPath = path.join(ROOT, "public", "default-data", "material.xlsx");
const srcWb = XLSX.readFile(srcPath);

// -----------------------------------------------------------------------
// ヘルパー: 列インデックスから該当年度・月のデータを抽出
// -----------------------------------------------------------------------

/**
 * source xlsx の行データから、指定年度の列インデックス群を解決する。
 * ヘッダー行の "YYYY年N月" パターンを走査する。
 */
function resolveYearColumns(headerRow, fiscalYear, months) {
  const result = [];
  for (const month of months) {
    const target = `${fiscalYear}年${month}月`;
    const idx = headerRow.findIndex((c) => String(c ?? "").trim() === target);
    if (idx === -1) throw new Error(`列が見つかりません: ${target}`);
    result.push({ month, colIndex: idx });
  }
  return result;
}

/**
 * カテゴリ名から「売上」接尾辞を除去してDBのname列と一致させる。
 * 「売上」以外の末尾パターン（例: 売上合計, 経費合計）はそのまま返す。
 * 接尾辞がなければそのまま返す。
 */
function normalizeLabel(label) {
  // "XXX売上" -> "XXX"  (ただし「売上合計」などは除外)
  if (label.endsWith("売上") && !label.endsWith("売上合計")) {
    return label.slice(0, -2);
  }
  return label;
}

/**
 * source シートから必要な行・列だけ抽出し、import フォーマットの行配列を返す。
 * @param {string} sheetName - source xlsx のシート名
 * @param {number} fiscalYear
 * @param {number[]} months - 報告月リスト（例: [3,6,9,12]）
 * @param {number[]} headerRowIndices - ヘッダー行のrow index（売上/経費ヘッダーの行番号）
 * @param {Array<{rowIdx: number, label: string}>} dataRows - 取り込む行の定義
 */
function extractSheet(sheetName, fiscalYear, months, dataRowDefs) {
  const ws = srcWb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // 全ヘッダー行を結合して列インデックスを解決（売上/経費ヘッダーは同じ列構成なので1度解決でOK）
  // ヘッダー行を全行から検索
  let headerRow = null;
  for (const row of rows) {
    if (!row) continue;
    // "YYYY年N月" パターンが2個以上あればヘッダー行とみなす
    const yearMonthCount = row.filter(
      (c) => typeof c === "string" && /^\d{4}年\d{1,2}月$/.test(c.trim()),
    ).length;
    if (yearMonthCount >= 2) {
      headerRow = row;
      break;
    }
  }
  if (!headerRow) throw new Error(`${sheetName}: ヘッダー行が見つかりません`);

  const yearCols = resolveYearColumns(headerRow, fiscalYear, months);

  // import フォーマット用の行配列を構築
  // 行0: ヘッダー
  const outputRows = [["", ...months.map((m) => `${m}月`)]];

  for (const { rowIdx, label } of dataRowDefs) {
    const row = rows[rowIdx];
    if (!row) continue;
    const amounts = yearCols.map(({ colIndex }) => {
      const v = row[colIndex];
      return typeof v === "number" ? v : 0;
    });
    outputRows.push([label, ...amounts]);
  }

  return outputRows;
}

// -----------------------------------------------------------------------
// 店舗別データ行定義
// -----------------------------------------------------------------------

// Tokyo: row index → DB category name (売上接尾辞除去)
const tokyoDataRows = [
  // SALES (row 3〜7)
  { rowIdx: 3, label: "生鮮食品" },
  { rowIdx: 4, label: "加工食品" },
  { rowIdx: 5, label: "菓子" },
  { rowIdx: 6, label: "飲料" },
  { rowIdx: 7, label: "惣菜" },
  // EXPENSE (row 12〜16)
  { rowIdx: 12, label: "人件費" },
  { rowIdx: 13, label: "水道光熱費" },
  { rowIdx: 14, label: "広告宣伝費" },
  { rowIdx: 15, label: "物流費" },
  { rowIdx: 16, label: "その他経費" },
];

// Osaka: row 3〜6 (SALES), row 11〜15 (EXPENSE)
const osakaDataRows = [
  { rowIdx: 3, label: "菓子" },
  { rowIdx: 4, label: "飲料" },
  { rowIdx: 5, label: "おもちゃ" },
  { rowIdx: 6, label: "日用品" },
  { rowIdx: 11, label: "人件費" },
  { rowIdx: 12, label: "広告宣伝費" },
  { rowIdx: 13, label: "物流費" },
  { rowIdx: 14, label: "その他経費" },
  { rowIdx: 15, label: "販管費" },
];

// Nagoya: row 3〜7 (SALES), row 13〜17 (EXPENSE)
const nagoyaDataRows = [
  { rowIdx: 3, label: "生鮮食品" },
  { rowIdx: 4, label: "菓子" },
  { rowIdx: 5, label: "飲料" },
  { rowIdx: 6, label: "惣菜" },
  { rowIdx: 7, label: "日用品" },
  { rowIdx: 13, label: "人件費" },
  { rowIdx: 14, label: "広告宣伝費" },
  { rowIdx: 15, label: "物流費" },
  { rowIdx: 16, label: "その他経費" },
  { rowIdx: 17, label: "雑費" },
];

// -----------------------------------------------------------------------
// 年度ごとにファイル生成
// -----------------------------------------------------------------------

for (const year of [2022, 2023, 2024]) {
  const wb = XLSX.utils.book_new();

  // 東京: 四半期報告 (3, 6, 9, 12月)
  const tokyoRows = extractSheet("Tokyo", year, [3, 6, 9, 12], tokyoDataRows);
  const tokyoWs = XLSX.utils.aoa_to_sheet(tokyoRows);
  XLSX.utils.book_append_sheet(wb, tokyoWs, "東京");

  // 大阪: 四半期報告 (3, 6, 9, 12月)
  const osakaRows = extractSheet("Osaka", year, [3, 6, 9, 12], osakaDataRows);
  const osakaWs = XLSX.utils.aoa_to_sheet(osakaRows);
  XLSX.utils.book_append_sheet(wb, osakaWs, "大阪");

  // 名古屋: 半期報告 (6, 12月)
  const nagoyaRows = extractSheet(
    "Nagoya",
    year,
    [6, 12],
    nagoyaDataRows,
  );
  const nagoyaWs = XLSX.utils.aoa_to_sheet(nagoyaRows);
  XLSX.utils.book_append_sheet(wb, nagoyaWs, "名古屋");

  const outPath = path.join(
    ROOT,
    "public",
    "default-data",
    `import-${year}.xlsx`,
  );
  XLSX.writeFile(wb, outPath);
  console.log(`✓ ${outPath}`);
}

console.log("完了: import-2022.xlsx / import-2023.xlsx / import-2024.xlsx");
