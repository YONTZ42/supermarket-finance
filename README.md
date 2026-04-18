# Supermarket Finance - 店舗横断決算管理システム

店舗ごとに異なる決算データ管理方式を統合し、半期（上期・下期）ごとの売上合計・経費合計・利益を全店舗共通フォーマットで比較できるようにするアプリケーションです。

## 概要

- **東京**: 四半期（3,6,9,12月）累積入力 → 差分で期間実績を算出
- **大阪**: 四半期（3,6,9,12月）期間別入力 → そのまま期間実績
- **名古屋**: 半期（6,12月）累積入力 → 差分で期間実績を算出

これらの異なる入力形式を `store_reporting_profiles` の設定（`inputMode` / `periodDefinitions`）で吸収し、store 名による if 分岐を排除しています。

## セットアップ

```bash
# 依存インストール
npm install

# 環境変数
cp .env.example .env
# DATABASE_URL を設定

# Prisma クライアント生成
npx prisma generate

# マイグレーション
npx prisma migrate dev

# seed 実行（マスタデータ + サンプル raw データ + 正規化 + サマリ生成）
npx prisma db seed

# 開発サーバー起動
npm run dev
```

## 画面

| 画面 | パス | 概要 |
|---|---|---|
| データ登録 | `/data-entry` | 店舗・年度を選んでカテゴリごとに金額入力 |
| サマリ | `/summary` | 年度・店舗・半期で売上/経費/利益を一覧・グラフ表示 |

## API

| Endpoint | Method | 概要 |
|---|---|---|
| `/api/stores` | GET | 店舗設定一覧（reporting profile + categories） |
| `/api/finance/summary` | GET | サマリ取得（年度/店舗/半期でフィルタ可） |
| `/api/finance/raw-records` | GET | 指定店舗・年度の入力データ取得 |
| `/api/finance/raw-records` | POST | 入力データ登録・更新 + 自動再計算 |
| `/api/finance/import-excel` | POST | Excel ファイルインポート（FormData） |

詳細は [docs/api-design.md](docs/api-design.md) を参照。

## Excel インポート

配布された Excel ファイルを取り込むには、以下のいずれかの方法を使います。

### CLI（推奨）

```bash
# マスタデータ投入済みの状態で実行
npm run import-excel -- ./data/financial_data.xlsx 2022
```

### API

```bash
curl -X POST http://localhost:3000/api/finance/import-excel \
  -F "file=@./data/financial_data.xlsx" \
  -F "fiscalYear=2022"
```

### Excel ファイルの前提

- シート名が店舗名（東京, 大阪, 名古屋）または店舗コード（TOKYO 等）であること
- ヘッダー行に「3月」「6月」等の形式で報告月が記載されていること
- データ行の第 1 列がカテゴリ名（生鮮食品, 人件費 等）であること
- ダッシュボードシートは自動スキップされる

### DB データの確認

```bash
npm run export-seed-json
```

## データ処理フロー

```
raw_records（入力原本）
  ↓ inputMode に基づき正規化
normalized_records（期間実績）
  ↓ SALES/EXPENSE を集計
summary_records（半期サマリ）
```

- **PERIODIC**: rawAmount をそのまま期間実績にする
- **CUMULATIVE**: current - previous の差分で期間実績を算出

詳細は [docs/normalization-rules.md](docs/normalization-rules.md) を参照。

## 技術構成

| 区分 | 技術 |
|---|---|
| フレームワーク | Next.js 16 (App Router) |
| 言語 | TypeScript (strict) |
| DB | PostgreSQL (Neon) |
| ORM | Prisma 7 |
| バリデーション | Zod |
| スタイル | Tailwind CSS |

詳細は [docs/tech-stack.md](docs/tech-stack.md) を参照。

## ドキュメント

| ファイル | 内容 |
|---|---|
| [docs/requirements.md](docs/requirements.md) | 要件定義 |
| [docs/architecture.md](docs/architecture.md) | 全体設計 |
| [docs/data-model.md](docs/data-model.md) | データモデル設計 |
| [docs/normalization-rules.md](docs/normalization-rules.md) | 正規化ルール |
| [docs/api-design.md](docs/api-design.md) | API 設計 |
| [docs/tech-stack.md](docs/tech-stack.md) | 技術構成 |

## 設計意図

1. **データ処理の正確性を最優先** — 正規化ロジックを `src/server/modules/finance/normalizers/` に集約
2. **店舗追加を設定で吸収** — `store_reporting_profiles` と `categories` を追加するだけで新店舗に対応
3. **責務分離** — raw（入力原本）/ normalized（比較用）/ summary（表示用）の 3 層構造
4. **監査可能性** — `audit_logs` で変更履歴を保持
5. **拡張性** — グラフライブラリの差し替え（Recharts → visx）、LLM フィルタの後付けに対応可能な構造
