# 正規化ルール

## 概要

店舗ごとの入力形式の違いを吸収し、共通の「期間実績」に変換するルール。
実装: `src/server/modules/finance/normalizers/`

正規化の起点は `normalizeRawRecords()` で、`inputMode` の値に基づいて処理を振り分ける。
store 名による分岐は行わない。

## 1. PERIODIC（期間別入力）

入力値をそのまま期間実績とする。
実装: `normalize-periodic.ts`

適用例: 大阪（四半期ごとの期間別入力）

```
rawAmount → normalized amount（変換なし）
```

## 2. CUMULATIVE（累積入力）

各報告月の入力値から直前報告月の入力値を差し引き、期間実績とする。
最初の報告期間は累積値がそのまま期間実績になる。
実装: `normalize-cumulative.ts`

### 例: 東京（四半期累積、reportMonths=[3,6,9,12]）

| 報告月 | rawAmount（累積） | 計算 | normalized amount |
|---|---|---|---|
| 3月 | 1,200,000 | そのまま | 1,200,000 (Q1) |
| 6月 | 2,500,000 | 2,500,000 - 1,200,000 | 1,300,000 (Q2) |
| 9月 | 4,000,000 | 4,000,000 - 2,500,000 | 1,500,000 (Q3) |
| 12月 | 5,500,000 | 5,500,000 - 4,000,000 | 1,500,000 (Q4) |

### 例: 名古屋（半期累積、reportMonths=[6,12]）

| 報告月 | rawAmount（累積） | 計算 | normalized amount |
|---|---|---|---|
| 6月 | 3,000,000 | そのまま | 3,000,000 (H1) |
| 12月 | 6,500,000 | 6,500,000 - 3,000,000 | 3,500,000 (H2) |

### 前期データ欠損時

前報告月の raw_record が存在しない場合、当該期間の累積値をそのまま期間実績として扱う。

## 3. 半期サマリ（Half Summary）

normalized_records から半期ごとの集計を算出する。
実装: `build-summary.ts`

```
H1 salesTotal  = H1 に属する SALES カテゴリの amount 合計
H1 expenseTotal = H1 に属する EXPENSE カテゴリの amount 合計
H1 profit      = salesTotal - expenseTotal

H2 も同様
```

各 normalized_record がどの半期に属するかは `periodDefinitions` の `half` フィールドで決まる。

## 4. 再計算フロー

`recalculateStoreYear(prisma, { storeId, fiscalYear })` が以下を実行する:

1. reporting profile・raw records・categories を取得（Read）
2. `normalizeRawRecords()` で正規化（Compute）
3. `buildHalfSummaries()` で半期サマリ算出（Compute）
4. トランザクション内で旧 normalized/summary を削除し新データを書き込み（Write）
5. 監査ログを記録
