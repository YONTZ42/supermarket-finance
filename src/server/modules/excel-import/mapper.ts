import type { ParsedExcelRow } from "./parser";
import type { PeriodDefinition } from "@/src/server/modules/store-config/types";

/** mapper が出力する raw record 入力データ */
export type ImportRawRecord = {
  storeCode: string;
  fiscalYear: number;
  categoryCode: string;
  reportMonth: number;
  periodCode: string;
  inputModeSnapshot: "CUMULATIVE" | "PERIODIC";
  rawAmount: string;
  sourceType: "IMPORT";
  sourceFileName: string;
};

/** mapper に渡す店舗情報 */
export type StoreLookup = {
  code: string;
  inputMode: "CUMULATIVE" | "PERIODIC";
  categoryNameToCode: Map<string, string>;
  periodDefinitions: PeriodDefinition[];
};

/** マッピング時のスキップ/エラー記録 */
export type MapResult = {
  records: ImportRawRecord[];
  skipped: Array<{
    sheetName: string;
    rowLabel: string;
    reportMonth: number;
    reason: string;
  }>;
};

/**
 * parser の出力をアプリ内部型（raw record 相当）へ変換する。
 *
 * - sheetName → store code（storeLookup で解決）
 * - rowLabel → category code（store ごとの categoryNameToCode で解決）
 * - reportMonth → periodCode（periodDefinitions で解決）
 * - 解決できない行はスキップし、理由を記録する
 */
export function mapExcelRowsToRawRecords(
  rows: ParsedExcelRow[],
  storeLookup: Map<string, StoreLookup>,
  fiscalYear: number,
  sourceFileName: string,
): MapResult {
  const records: ImportRawRecord[] = [];
  const skipped: MapResult["skipped"] = [];

  for (const row of rows) {
    // 店舗解決
    const store = storeLookup.get(row.sheetName);
    if (!store) {
      skipped.push({
        ...row,
        reason: `シート「${row.sheetName}」に対応する店舗が見つかりません`,
      });
      continue;
    }

    // カテゴリ解決
    const categoryCode = store.categoryNameToCode.get(row.rowLabel);
    if (!categoryCode) {
      skipped.push({
        ...row,
        reason: `カテゴリ「${row.rowLabel}」が店舗「${store.code}」に存在しません`,
      });
      continue;
    }

    // 期間コード解決
    const pd = store.periodDefinitions.find(
      (p) => p.reportMonth === row.reportMonth,
    );
    if (!pd) {
      skipped.push({
        ...row,
        reason: `報告月 ${row.reportMonth} が店舗「${store.code}」の reportMonths に存在しません`,
      });
      continue;
    }

    records.push({
      storeCode: store.code,
      fiscalYear,
      categoryCode,
      reportMonth: row.reportMonth,
      periodCode: pd.code,
      inputModeSnapshot: store.inputMode,
      rawAmount: row.amount.toFixed(2),
      sourceType: "IMPORT",
      sourceFileName,
    });
  }

  return { records, skipped };
}
