# 設計書

## 1. 設計方針

本システムは、店舗ごとの入力差異を設定データで吸収し、内部的には期間実績データへ正規化したうえで半期サマリを生成する。

核となる制約:
- store 名で if 分岐しない
- `inputMode` と `periodDefinitions` に基づいて処理する
- `raw_records` → `normalized_records` → `summary_records` の責務を崩さない

## 2. データ処理フロー

```
raw_records（入力原本）
  ↓ normalizeRawRecords()
  ↓   inputMode === "PERIODIC"  → normalizePeriodic()   … rawAmount をそのまま
  ↓   inputMode === "CUMULATIVE"→ normalizeCumulative()  … current - previous
normalized_records（期間実績）
  ↓ buildHalfSummaries()
  ↓   SALES カテゴリの amount 合計 → salesTotal
  ↓   EXPENSE カテゴリの amount 合計 → expenseTotal
  ↓   profit = salesTotal - expenseTotal
summary_records（半期サマリ）
```

このフローは `recalculateStoreYear()` がオーケストレーションする。

## 3. 中核設計

### 3.1 raw_records
ユーザーが入力した元データを保持する。
累積型店舗では累積値、期間型店舗では期間値をそのまま保持する。
`inputModeSnapshot` で入力時の方式を記録し、後から再計算可能にする。

### 3.2 normalized_records
raw_records をもとに、比較・集計用の期間実績へ正規化したデータを保持する。
`NormalizedRecordRawRecord` で元の raw_records との紐付けを保持する。

### 3.3 summary_records
normalized_records をもとに、半期単位の売上・経費・利益を保持する。
サマリ画面・KPI 表示のための高速参照用テーブル。

## 4. 店舗差異の吸収

店舗ごとの差異は `store_reporting_profiles` と `categories` に保持する。

| 店舗 | inputMode | reportMonths | periodDefinitions |
|---|---|---|---|
| 東京 | CUMULATIVE | [3,6,9,12] | Q1-Q4（四半期） |
| 大阪 | PERIODIC | [3,6,9,12] | Q1-Q4（四半期） |
| 名古屋 | CUMULATIVE | [6,12] | H1-H2（半期） |

新しい店舗を追加する場合は `prisma/seed/master-data.ts` に設定を追加するだけで、アプリケーションロジックの変更は不要。

## 5. モジュール構成

```
src/server/
├── db/
│   ├── prisma.ts           … PrismaClient シングルトン
│   └── transactions.ts     … トランザクションヘルパー
├── modules/
│   ├── store-config/       … 店舗設定の取得・整形
│   │   ├── types.ts
│   │   ├── repository.ts
│   │   └── service.ts
│   ├── finance/            … 財務データの入力・正規化・集計
│   │   ├── types.ts
│   │   ├── repository.ts
│   │   ├── service.ts      … 公開窓口（re-export）
│   │   ├── selectors.ts    … データ整形ヘルパー
│   │   ├── normalizers/
│   │   │   ├── normalize-raw-records.ts  … 入口（inputMode で振り分け）
│   │   │   ├── normalize-periodic.ts     … PERIODIC 正規化
│   │   │   ├── normalize-cumulative.ts   … CUMULATIVE 正規化
│   │   │   └── build-summary.ts          … 半期サマリ構築
│   │   └── services/
│   │       ├── recalculate-store-year.ts  … 再計算オーケストレーション
│   │       ├── upsert-raw-record.ts      … 入力保存 + 再計算
│   │       └── get-summary.ts            … サマリ取得
│   ├── audit/              … 監査ログ
│   │   ├── repository.ts
│   │   └── service.ts
│   └── excel-import/       … Excel 取り込み
│       ├── parser.ts       … xlsx 読み取り（シート→行データ）
│       ├── mapper.ts       … 行データ→アプリ内部型変換
│       └── service.ts      … 保存 + 再計算オーケストレーション
```

## 6. API 設計

Route Handler はビジネスロジックを持たず、service を呼び出す。
DB モデルをそのまま返さず、DTO に整形して返す。
詳細は [api-design.md](api-design.md) を参照。

## 7. 初期データ投入

`prisma/seed.ts` が以下の順で実行する:
1. `master-data.ts` から店舗・reporting profile・categories を upsert
2. `raw-records.sample.ts` からサンプル raw データを upsert
3. `recalculateStoreYear()` で normalized / summary を生成

起動時点で Excel 由来データが表示される状態を作る。

## 8. 監査ログ

`audit_logs` テーブルに以下のアクションを記録する:
- `CREATE`: raw_record の新規作成
- `UPDATE`: raw_record の更新
- `RECALCULATE`: 再計算実行

`beforeValue` / `afterValue` を JSON で保持し、変更内容を追跡可能にする。

## 9. 将来拡張

| 項目 | 方針 |
|---|---|
| グラフライブラリ | 初期は Recharts、`src/components/charts/adapters/` 経由で visx に差し替え可能 |
| LLM フィルタ | 計算はさせず、フィルタ条件 JSON の生成のみ。`src/features/filters/` で受け入れ |
| 認証・権限 | 未実装。将来追加予定 |
| Excel インポート | CLI (`scripts/import-excel.ts`) および API (`/api/finance/import-excel`) で取り込み可能 |
