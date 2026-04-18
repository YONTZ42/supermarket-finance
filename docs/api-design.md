# API 設計書

## 1. 設計方針
- Route Handler にビジネスロジックを書かず、service を呼ぶ
- DB モデルをそのまま返さず、DTO に整形する
- request validation は zod で行う
- エラー時は意味のある日本語メッセージを返す

## 2. エンドポイント一覧

### GET /api/stores
店舗設定一覧を返す。フロント `StoreConfig` 型に合わせた形状。

Response:
```json
{
  "stores": [
    {
      "id": "cuid",
      "code": "TOKYO",
      "name": "東京",
      "inputMode": "CUMULATIVE",
      "fiscalYearStartMonth": 1,
      "reportMonths": [3, 6, 9, 12],
      "periodDefinitions": [
        { "code": "Q1", "reportMonth": 3, "coveredMonths": [1,2,3], "half": "H1", "displayOrder": 1 }
      ],
      "categories": [
        { "id": "cuid", "code": "fresh_food", "name": "生鮮食品", "kind": "SALES", "displayOrder": 1 },
        { "id": "cuid", "code": "labor", "name": "人件費", "kind": "EXPENSE", "displayOrder": 101 }
      ]
    }
  ]
}
```

### GET /api/finance/summary
サマリを返す。全パラメータ任意。指定なしで全件返却。

Query params:
- `fiscalYear` (number, optional)
- `storeCode` (string, optional)
- `half` ("H1" | "H2", optional)

Response:
```json
{
  "records": [
    {
      "storeCode": "TOKYO",
      "storeName": "東京",
      "fiscalYear": 2022,
      "half": "H1",
      "salesTotal": 5000000,
      "expenseTotal": 3000000,
      "profit": 2000000
    }
  ],
  "availableFiscalYears": [2022, 2021],
  "availableStores": [
    { "code": "NAGOYA", "name": "名古屋" },
    { "code": "OSAKA", "name": "大阪" },
    { "code": "TOKYO", "name": "東京" }
  ]
}
```

### GET /api/finance/raw-records
指定店舗・年度の入力データを返す。

Query params:
- `storeCode` (string, required)
- `fiscalYear` (number, required)

Response:
```json
{
  "records": [
    {
      "storeCode": "TOKYO",
      "fiscalYear": 2022,
      "categoryCode": "fresh_food",
      "reportMonth": 3,
      "periodCode": "Q1",
      "inputModeSnapshot": "CUMULATIVE",
      "rawAmount": 1200000,
      "sourceType": "EXCEL_SEED",
      "sourceFileName": "2022年度実績.xlsx"
    }
  ]
}
```

### POST /api/finance/raw-records
一括で入力データを登録・更新し、正規化・サマリ再計算を実行する。

Request body:
```json
{
  "storeCode": "TOKYO",
  "fiscalYear": 2022,
  "rows": [
    {
      "categoryCode": "fresh_food",
      "valuesByPeriod": { "Q1": 1200000, "Q2": 2500000 }
    },
    {
      "categoryCode": "labor",
      "valuesByPeriod": { "Q1": 800000, "Q2": 1600000 }
    }
  ]
}
```

Response:
```json
{
  "records": [
    {
      "storeCode": "TOKYO",
      "fiscalYear": 2022,
      "categoryCode": "fresh_food",
      "reportMonth": 3,
      "periodCode": "Q1",
      "inputModeSnapshot": "CUMULATIVE",
      "rawAmount": 1200000,
      "sourceType": "MANUAL_EDIT"
    }
  ],
  "savedAt": "2024-01-15T10:30:00.000Z",
  "message": "TOKYO / 2022 を 4 件保存しました"
}
```

### POST /api/finance/import-excel
Excel ファイルをインポートし、raw_records に保存後、正規化・サマリ再計算を実行する。

Request: `multipart/form-data`
- `file`: Excel ファイル (.xlsx)
- `fiscalYear`: 年度（数値文字列）

Response:
```json
{
  "imported": 40,
  "skipped": 2,
  "skippedDetails": [
    {
      "sheetName": "東京",
      "rowLabel": "不明カテゴリ",
      "reportMonth": 3,
      "reason": "カテゴリ「不明カテゴリ」が店舗「TOKYO」に存在しません"
    }
  ],
  "recalculated": ["TOKYO-2022", "OSAKA-2022", "NAGOYA-2022"]
}
```

## 3. エラーレスポンス形式
```json
{
  "error": "エラーメッセージ",
  "details": { ... }
}
```

- 400: バリデーションエラー（details に zod の flatten 結果）
- 404: 対象リソースが見つからない
- 500: サーバーエラー
- 501: 未実装
