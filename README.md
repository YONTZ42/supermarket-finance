# Supermarket Finance — 店舗横断決算管理システム

各店舗がバラバラに Excel 管理していた決算データを一元化し、半期（上期・下期）ごとの売上・経費・利益を全店舗共通フォーマットで比較・分析するアプリケーション。

---

## 背景

| 店舗 | 入力方式 | 報告月 | カテゴリ例 |
|---|---|---|---|
| 東京 | 累積入力 (CUMULATIVE) | 3, 6, 9, 12月 | 生鮮食品, 加工食品, 人件費 … |
| 大阪 | 期間別入力 (PERIODIC) | 3, 6, 9, 12月 | 菓子, 飲料, 販管費 … |
| 名古屋 | 累積入力 (CUMULATIVE) | 6, 12月 | 生鮮食品, 惣菜, 雑費 … |

店舗名による if 分岐は行わず、`store_reporting_profiles` の設定（`inputMode` / `periodDefinitions`）で差異を吸収している。新店舗追加はマスタデータ追加のみで対応可能。

---

## 画面構成

| 画面 | パス | 概要 |
|---|---|---|
| データ登録 | `/data-entry` | 店舗・年度を選び、カテゴリ別に金額を入力。保存時に正規化・再計算が自動実行される |
| サマリ | `/summary` | KPI カード・比較グラフ・詳細表で全店舗の半期実績を一覧・比較 |

### サマリ画面の3層構造

```
[メイン比較エリア]  全店舗・全期間の grouped / stacked bar chart
       ↓ クリックで同期
[追加分析エリア]   任意条件の分析カードを複数並列表示
       ↓
[詳細表エリア]     グラフ選択 or フィルタ条件に一致する数値一覧
```

---

## データ処理フロー

```
raw_records（入力原本）
  ↓ inputMode に基づいて正規化
normalized_records（期間実績）
  ↓ SALES / EXPENSE をカテゴリ別に集計
summary_records（半期サマリ）
```

`recalculateStoreYear()` がオーケストレーションし、`POST /api/finance/raw-records` 呼び出し時に自動実行される。

### 正規化ルール

**PERIODIC（大阪）** — rawAmount をそのまま期間実績とする。

**CUMULATIVE（東京・名古屋）** — 当月累積から前月累積を差し引いて期間実績を算出。

```
東京（四半期累積）
  3月: 1,200,000          →  Q1実績: 1,200,000
  6月: 2,500,000  − 1,200,000 →  Q2実績: 1,300,000
  9月: 4,000,000  − 2,500,000 →  Q3実績: 1,500,000
 12月: 5,500,000  − 4,000,000 →  Q4実績: 1,500,000

名古屋（半期累積）
  6月: 3,000,000          →  H1実績: 3,000,000
 12月: 6,500,000  − 3,000,000 →  H2実績: 3,500,000
```

半期サマリは normalized_records を `periodDefinitions.half` でグループ化し、SALES 合計 − EXPENSE 合計 = 利益として算出。

---

## データモデル

SSOT は `prisma/schema.prisma`。

```
Store 1──1 StoreReportingProfile
Store 1──* Category
Store 1──* RawRecord
Store 1──* NormalizedRecord
Store 1──* SummaryRecord

RawRecord *──* NormalizedRecord  (via NormalizedRecordRawRecord)
```

| テーブル | 役割 |
|---|---|
| `stores` | 店舗基本情報（code: TOKYO / OSAKA / NAGOYA） |
| `store_reporting_profiles` | 入力方式・報告月・期間定義。店舗差異を吸収する中心テーブル |
| `categories` | 店舗ごとの売上/経費カテゴリ（SALES / EXPENSE） |
| `raw_records` | ユーザー入力原本。累積型は累積値のまま保持 |
| `normalized_records` | 差分計算済みの期間実績。比較・集計の基盤 |
| `summary_records` | 半期ごとの売上合計・経費合計・利益。サマリ画面の高速参照用 |
| `audit_logs` | raw_record の作成・更新・再計算の変更履歴 |

金額は `Decimal(14,2)` で管理。

---

## API

| Endpoint | Method | 概要 |
|---|---|---|
| `/api/stores` | GET | 店舗設定一覧（reporting profile + categories） |
| `/api/finance/summary` | GET | サマリ取得（`fiscalYear` / `storeCode` / `half` でフィルタ可） |
| `/api/finance/raw-records` | GET | 指定店舗・年度の入力データ取得 |
| `/api/finance/raw-records` | POST | 入力データ登録・更新 + 自動再計算 |
| `/api/finance/normalized` | GET | 正規化済みカテゴリ実績取得（カテゴリ内訳グラフ用） |
| `/api/finance/import-excel` | POST | Excel ファイルインポート（multipart/form-data） |

Route Handler にビジネスロジックを持たせず service を呼ぶ。DB モデルはそのまま返さず DTO に整形。エラーは `{ error, details }` 形式で返す。

詳細は [docs/api-design.md](docs/api-design.md) を参照。

---

## グラフ設計

グラフ描画は **visx** を採用（細かいレイアウト制御・grouped/stacked bar 複合要件・インタラクションの組み込みやすさ）。

グラフコンポーネントは業務ロジックを持たない。整形は `features/*/lib/` が担い、描画は `src/components/charts/` のアダプター経由で行う（Recharts ↔ visx の差し替えが可能）。

**メイン比較グラフ** — X軸: `年度-半期`、Y軸: 金額、1期間ごとに店舗別の棒を並べる。表示モード: 合計 / P&L / 売上カテゴリ内訳 / 経費カテゴリ内訳。

詳細は [docs/graph-design.md](docs/graph-design.md) を参照。

---

## ディレクトリ構成

```
app/
├── (dashboard)/
│   ├── summary/page.tsx
│   └── data-entry/page.tsx
└── api/
    ├── stores/
    └── finance/  (summary / raw-records / normalized / import-excel)

src/
├── server/
│   ├── db/              prisma シングルトン・トランザクションヘルパー
│   └── modules/
│       ├── store-config/ 店舗設定の取得・整形
│       ├── finance/
│       │   ├── normalizers/  normalize-raw-records / periodic / cumulative / build-summary
│       │   └── services/     recalculate-store-year / upsert-raw-record / get-summary
│       ├── audit/        監査ログ
│       └── excel-import/ parser / mapper / service
├── features/
│   ├── summary/         components / hooks / lib
│   ├── data-entry/      components / hooks / lib
│   └── filters/         SummaryFilterPanel / filter-schema
└── components/charts/
    └── adapters/        recharts / visx（差し替え可能な構造）

prisma/
├── schema.prisma
├── seed.ts
└── seed/ (master-data.ts / raw-records.sample.ts)

scripts/
├── import-excel.ts      Excel CLI インポート
└── export-seed-json.ts  DB データ確認用
```

---

## セットアップ

```bash
npm install

# .env に DATABASE_URL (PostgreSQL) を設定
cp .env.example .env

npx prisma generate
npx prisma migrate dev

# マスタデータ + サンプル raw データ + 正規化 + サマリ生成
npx prisma db seed

npm run dev
```

---

## Excel インポート

```bash
# CLI（推奨）
npm run import-excel -- ./data/financial_data.xlsx 2022

# API
curl -X POST http://localhost:3000/api/finance/import-excel \
  -F "file=@./data/financial_data.xlsx" \
  -F "fiscalYear=2022"
```

**Excel ファイルの前提**:
- シート名が店舗名（東京, 大阪, 名古屋）または店舗コード（TOKYO 等）
- ヘッダー行に「3月」「6月」等の形式で報告月が記載
- データ行の第 1 列がカテゴリ名
- ダッシュボードシートは自動スキップ

---

## 技術構成

| 区分 | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) / React 19 |
| 言語 | TypeScript 5 (strict) |
| DB | PostgreSQL (Neon) |
| ORM | Prisma 7 + `@prisma/adapter-neon` |
| バリデーション | Zod 4 |
| スタイル | Tailwind CSS 4 |
| グラフ | visx（recharts アダプターも用意） |
| Excel | xlsx 0.18.5 |

---

## 設計方針

1. **店舗名で分岐しない** — `inputMode` と `periodDefinitions` で処理を決定。新店舗はマスタ追加のみ。
2. **3層データ分離** — `raw`（入力原本）/ `normalized`（比較用期間実績）/ `summary`（表示用半期集計）。
3. **正確性優先** — 金額は `Decimal(14,2)`、正規化ロジックは `normalizers/` に集約。
4. **監査可能性** — `audit_logs` で CREATE / UPDATE / RECALCULATE の変更前後を JSON で保持。
5. **拡張性** — グラフライブラリ差し替え（adapter 構成）、LLM フィルタの後付け（`features/filters/` で受け入れ）に対応。

---

## ドキュメント

| ファイル | 内容 |
|---|---|
| [docs/requirements.md](docs/requirements.md) | 要件定義・スコープ・非機能要件 |
| [docs/architecture.md](docs/architecture.md) | 全体設計・モジュール構成・フロー |
| [docs/data-model.md](docs/data-model.md) | ER 図・全テーブル定義・enum |
| [docs/normalization-rules.md](docs/normalization-rules.md) | 正規化ルール詳細・数値例 |
| [docs/api-design.md](docs/api-design.md) | エンドポイント仕様・リクエスト/レスポンス例 |
| [docs/graph-design.md](docs/graph-design.md) | グラフ設計・表示モード・インタラクション仕様 |
| [docs/tech-stack.md](docs/tech-stack.md) | 技術選定理由 |
