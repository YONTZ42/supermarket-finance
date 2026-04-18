import * as XLSX from "xlsx";

/** parser が出力する 1 セル分のデータ */
export type ParsedExcelRow = {
  sheetName: string;
  rowLabel: string;
  reportMonth: number;
  amount: number;
};

/** スキップ対象のシート名 */
const SKIP_SHEETS = new Set(["ダッシュボード", "Dashboard", "dashboard"]);

/**
 * Excel ファイルを読み取り、各シートの行データをフラットに返す。
 *
 * 想定フォーマット（シートごと）:
 *   行1: ヘッダー — 空セル, "3月", "6月", "9月", "12月" など
 *   行2〜: カテゴリ名, 金額, 金額, ...
 *
 * - ダッシュボード系シートはスキップする
 * - 空セル・非数値セルはスキップする
 * - ヘッダーから月番号を抽出する（"3月" → 3, "6月" → 6）
 */
export function parseExcelFile(filePath: string): ParsedExcelRow[] {
  // XLSX.readFile は Next.js の webpack バンドル内で _fs が undefined になるため
  // fs.readFileSync で読み込んだバッファを XLSX.read に渡す
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const buffer: Buffer = require("fs").readFileSync(filePath);
  return parseExcelBuffer(buffer);
}

/**
 * Buffer から Excel を読み取り、各シートの行データをフラットに返す。
 * API ルートハンドラなど、ファイルパスを経由しない場合に使う。
 */
export function parseExcelBuffer(buffer: Buffer): ParsedExcelRow[] {
  const workbook = XLSX.read(buffer);
  const results: ParsedExcelRow[] = [];

  for (const sheetName of workbook.SheetNames) {
    if (SKIP_SHEETS.has(sheetName)) continue;

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
    if (rows.length < 2) continue;

    // ヘッダー行から月番号を抽出
    const headerRow = rows[0] as unknown[];
    const monthColumns = parseHeaderMonths(headerRow);
    if (monthColumns.length === 0) continue;

    // データ行を処理
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i] as unknown[];
      if (!row || row.length === 0) continue;

      const rowLabel = String(row[0] ?? "").trim();
      if (!rowLabel) continue;

      for (const { colIndex, month } of monthColumns) {
        const cellValue = row[colIndex];
        if (cellValue == null) continue;

        const amount = toNumber(cellValue);
        if (amount == null) continue;

        results.push({ sheetName, rowLabel, reportMonth: month, amount });
      }
    }
  }

  return results;
}

// ---------- helpers ----------

type MonthColumn = { colIndex: number; month: number };

/** ヘッダー行から "3月" / "6月" 等のパターンで月番号を抽出 */
function parseHeaderMonths(headerRow: unknown[]): MonthColumn[] {
  const columns: MonthColumn[] = [];
  const monthPattern = /^(\d{1,2})月$/;

  for (let i = 1; i < headerRow.length; i++) {
    const cell = String(headerRow[i] ?? "").trim();
    const match = cell.match(monthPattern);
    if (match) {
      const month = parseInt(match[1], 10);
      if (month >= 1 && month <= 12) {
        columns.push({ colIndex: i, month });
      }
    }
  }

  return columns;
}

/** セル値を数値に変換。数値でなければ null */
function toNumber(value: unknown): number | null {
  if (typeof value === "number" && isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const num = Number(cleaned);
    if (isFinite(num)) return num;
  }
  return null;
}
