# データモデル設計

SSOT: `prisma/schema.prisma`

## ER 関係

```
Store 1──1 StoreReportingProfile
Store 1──* Category
Store 1──* RawRecord
Store 1──* NormalizedRecord
Store 1──* SummaryRecord

Category 1──* RawRecord
Category 1──* NormalizedRecord

RawRecord *──* NormalizedRecord  (via NormalizedRecordRawRecord)
```

## stores
店舗基本情報。

| カラム | 型 | 説明 |
|---|---|---|
| id | String (cuid) | PK |
| code | String (unique) | 店舗コード（TOKYO, OSAKA, NAGOYA） |
| name | String | 表示名 |
| isActive | Boolean | 有効フラグ |

## store_reporting_profiles
店舗ごとの入力方式・報告月・期間定義。店舗差異を設定で吸収する中心テーブル。

| カラム | 型 | 説明 |
|---|---|---|
| id | String (cuid) | PK |
| storeId | String (unique) | FK → stores |
| inputMode | InputMode | CUMULATIVE / PERIODIC |
| fiscalYearStartMonth | Int | 会計年度開始月（デフォルト 1） |
| reportMonths | Int[] | 報告月の配列（例: [3,6,9,12]） |
| periodDefinitions | Json | 期間定義の配列（下記参照） |

### periodDefinitions の構造
```json
[
  {
    "code": "Q1",
    "reportMonth": 3,
    "coveredMonths": [1, 2, 3],
    "half": "H1",
    "displayOrder": 1
  }
]
```

## categories
店舗ごとの売上/経費カテゴリ。

| カラム | 型 | 説明 |
|---|---|---|
| id | String (cuid) | PK |
| storeId | String | FK → stores |
| code | String | カテゴリコード |
| name | String | 表示名 |
| kind | CategoryKind | SALES / EXPENSE |
| displayOrder | Int | 表示順 |
| isActive | Boolean | 有効フラグ |

ユニーク制約: `(storeId, code)`, `(storeId, name)`

## raw_records
ユーザーが入力した元データ。累積型店舗では累積値、期間型店舗では期間値をそのまま保持する。

| カラム | 型 | 説明 |
|---|---|---|
| id | String (cuid) | PK |
| storeId | String | FK → stores |
| fiscalYear | Int | 会計年度 |
| categoryId | String | FK → categories |
| reportMonth | Int | 報告月 |
| periodCode | String | 期間コード（Q1, H1 等） |
| inputModeSnapshot | InputMode | 入力時の方式スナップショット |
| rawAmount | Decimal(14,2) | 入力金額 |
| sourceType | RecordSourceType | EXCEL_SEED / MANUAL_EDIT / IMPORT |
| sourceFileName | String? | Excel ファイル名（任意） |

ユニーク制約: `(storeId, fiscalYear, categoryId, reportMonth)`

## normalized_records
raw_records を正規化した期間実績。比較・集計の基盤。

| カラム | 型 | 説明 |
|---|---|---|
| id | String (cuid) | PK |
| storeId | String | FK → stores |
| fiscalYear | Int | 会計年度 |
| categoryId | String | FK → categories |
| normalizedPeriodCode | String | 正規化後の期間コード |
| half | Half | H1 / H2 |
| coveredMonths | Int[] | 対象月の配列 |
| amount | Decimal(14,2) | 期間実績金額 |

ユニーク制約: `(storeId, fiscalYear, categoryId, normalizedPeriodCode)`

## normalized_record_raw_records
normalized_records と raw_records の多対多リンク。どの raw から正規化されたかを追跡する。

| カラム | 型 | 説明 |
|---|---|---|
| normalizedRecordId | String | FK → normalized_records |
| rawRecordId | String | FK → raw_records |

複合 PK: `(normalizedRecordId, rawRecordId)`

## summary_records
半期ごとの売上・経費・利益。サマリ画面の高速参照用。

| カラム | 型 | 説明 |
|---|---|---|
| id | String (cuid) | PK |
| storeId | String | FK → stores |
| fiscalYear | Int | 会計年度 |
| half | Half | H1 / H2 |
| salesTotal | Decimal(14,2) | 売上合計 |
| expenseTotal | Decimal(14,2) | 経費合計 |
| profit | Decimal(14,2) | 利益（salesTotal - expenseTotal） |

ユニーク制約: `(storeId, fiscalYear, half)`

## audit_logs
変更履歴。

| カラム | 型 | 説明 |
|---|---|---|
| id | String (cuid) | PK |
| targetType | String | 対象タイプ（raw_record, store_year） |
| targetId | String | 対象 ID |
| storeId | String? | 店舗 ID |
| fiscalYear | Int? | 会計年度 |
| action | String | CREATE / UPDATE / DELETE / RECALCULATE |
| beforeValue | Json? | 変更前の値 |
| afterValue | Json? | 変更後の値 |
| reason | String? | 変更理由 |

## enum 定義

| enum | 値 |
|---|---|
| InputMode | CUMULATIVE, PERIODIC |
| CategoryKind | SALES, EXPENSE |
| RecordSourceType | EXCEL_SEED, MANUAL_EDIT, IMPORT |
| Half | H1, H2 |
