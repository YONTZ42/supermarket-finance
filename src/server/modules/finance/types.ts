import type { Prisma } from "@prisma/client";

// ---------- normalizer I/O ----------

/** normalizer への入力となる raw record の最小型 */
export type RawRecordSlice = {
  id: string;
  categoryId: string;
  reportMonth: number;
  rawAmount: Prisma.Decimal;
};

/** normalizer が出力する正規化済みレコード */
export type NormalizedInput = {
  storeId: string;
  fiscalYear: number;
  categoryId: string;
  normalizedPeriodCode: string;
  half: "H1" | "H2";
  coveredMonths: number[];
  amount: Prisma.Decimal;
  rawRecordIds: string[];
};

// ---------- summary ----------

export type HalfTotals = {
  salesTotal: Prisma.Decimal;
  expenseTotal: Prisma.Decimal;
};

/** API レスポンス向けの summary DTO（フロント domain.SummaryRecord に合わせる） */
export type SummaryDTO = {
  storeCode: string;
  storeName: string;
  fiscalYear: number;
  half: "H1" | "H2";
  salesTotal: number;
  expenseTotal: number;
  profit: number;
};

/** サマリ API の full response（availableFiscalYears / availableStores を含む） */
export type SummaryApiResult = {
  records: SummaryDTO[];
  availableFiscalYears: number[];
  availableStores: Array<{ code: string; name: string }>;
};

/** サマリ検索条件（storeCode ベース） */
export type SummaryFilter = {
  fiscalYear?: number;
  storeCode?: string;
  half?: "H1" | "H2";
};

// ---------- raw record ----------

/** API レスポンス向けの raw record DTO（フロント domain.RawRecord に合わせる） */
export type RawRecordDTO = {
  storeCode: string;
  fiscalYear: number;
  categoryCode: string;
  reportMonth: number;
  periodCode: string;
  inputModeSnapshot: string;
  rawAmount: number;
  sourceType: string;
  sourceFileName?: string;
};

// ---------- normalized record ----------

/** API レスポンス向けの正規化済みレコード DTO（フロント domain.NormalizedRecord に合わせる） */
export type NormalizedDTO = {
  storeCode: string;
  storeName: string;
  fiscalYear: number;
  half: "H1" | "H2";
  categoryCode: string;
  categoryName: string;
  kind: "SALES" | "EXPENSE";
  periodCode: string;
  amount: number;
};

/** normalized API の full response */
export type NormalizedApiResult = {
  records: NormalizedDTO[];
};

/** フロントまたは import から受け取る raw record 入力（ID ベース） */
export type RawRecordInput = {
  storeId: string;
  fiscalYear: number;
  categoryId: string;
  reportMonth: number;
  periodCode: string;
  rawAmount: string;
  sourceType: "MANUAL_EDIT" | "IMPORT";
};

/** フロントの SavePayload に対応する bulk upsert 入力（code ベース） */
export type BulkUpsertPayload = {
  storeCode: string;
  fiscalYear: number;
  rows: Array<{
    categoryCode: string;
    valuesByPeriod: Record<string, number>;
  }>;
};

/** bulk upsert の結果 */
export type BulkUpsertResult = {
  records: RawRecordDTO[];
  savedAt: string;
  message: string;
};
