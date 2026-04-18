
---

# ディレクトリ構成説明

本ドキュメントは、本課題向けアプリケーションのディレクトリ構成と、各ファイル・ディレクトリの責務を説明するものです。

本構成は、以下の方針に基づいています。

- 店舗ごとの管理方法の違いを、設定データで吸収する
- 入力値は `raw_records` に保持し、比較・集計用には `normalized_records` に正規化する
- 半期ごとの売上合計・経費合計・利益は `summary_records` で扱う
- Excel は初期データソースとし、seed/import により「Excelのデータが入っている状態で起動」できるようにする
- バックエンドの正規化ロジックは Claude Code で固め、フロントエンドの画面改善は Codex で進めやすいように責務分離する
- グラフはまず Recharts を使い、後から visx に差し替えられるよう adapter 構成にする
- LLM は後付けとし、計算は行わず絞り込み条件の生成のみを担当させる

これらの方針は、課題で求められている「店舗ごとに異なる入力形式を統合し、半期ごとの売上・経費・利益を共通フォーマットで比較できること」と整合しています。東京・名古屋の累積データは差分計算で期間実績へ変換し、大阪の期間別データと同じ比較基盤に乗せます。


---

## 1. ルート直下

### `README.md`

プロジェクト全体の入口です。

主な役割:

* セットアップ手順
* DB起動・マイグレーション・seed 実行手順
* Excel 取り込み手順
* 開発方針の要約
* docs 配下へのリンク
* 課題要件に対して何をどう満たしているかの概要

### `package.json`

依存パッケージと npm scripts を定義します。

主な役割:

* `dev`, `build`, `start`
* `prisma generate`, `prisma migrate`, `prisma db seed`
* `import-excel` などの補助スクリプト

### `tsconfig.json`

TypeScript 設定ファイルです。

主な役割:

* `strict` 設定
* path alias
* app / src / prisma の参照整理

### `public/`

静的アセット置き場です。

主な役割:

* ロゴ
* 画面キャプチャ
* デモ用画像
* 必要に応じてサンプルExcelの配置

---

## 2. `app/` 配下

Next.js App Router の画面と API の入口です。
page ファイルにはロジックを極力書かず、`src/features` や `src/server` に責務を寄せます。

### `app/layout.tsx`

アプリ全体のルートレイアウトです。

主な役割:

* HTML / body 定義
* グローバルスタイル読み込み
* ThemeProvider, QueryClientProvider などの設定

### `app/page.tsx`

トップページです。

主な役割:

* 「データ登録画面」への導線
* 「サマリ画面」への導線
* 課題の概要や簡易ナビゲーションの表示

---

### `app/(dashboard)/layout.tsx`

管理画面系ページの共通レイアウトです。

主な役割:

* サイドバー
* ヘッダー
* 共通余白
* ページタイトル枠

### `app/(dashboard)/summary/page.tsx`

サマリ画面のページエントリです。

主な役割:

* フィルタパネル表示
* KPIカード表示
* 表・グラフコンポーネントの組み立て
* `useSummaryQuery` の呼び出し

### `app/(dashboard)/data-entry/page.tsx`

データ登録画面のページエントリです。

主な役割:

* 店舗・年度選択
* 入力フォーム表示
* 最新入力値や推移グラフの表示
* 登録後の再取得処理

---

## 3. `app/api/` 配下

Next.js の Route Handler をまとめる場所です。
フロントからの入力・取得要求を受け、`src/server/modules` のユースケースを呼び出します。

### `app/api/stores/route.ts`

店舗一覧と店舗設定情報を返します。

主な役割:

* 店舗一覧取得
* 店舗ごとの `store_reporting_profiles` 取得
* 店舗ごとの `categories` 取得

### `app/api/finance/summary/route.ts`

サマリ画面用データを返します。

主な役割:

* 年度・店舗・半期などの絞り込み条件を受け取る
* `summary_records` を基に一覧・グラフ表示向けデータを返す

### `app/api/finance/raw-records/route.ts`

入力データの登録・更新 API です。

主な役割:

* raw record の upsert
* 入力バリデーション
* 正規化再計算の起動
* 監査ログ記録

### `app/api/finance/import-excel/route.ts`

ブラウザ経由で Excel を取り込みたい場合の API です。

主な役割:

* Excel ファイル受け取り
* parser / mapper / service の呼び出し
* import 結果の返却

---

## 4. `src/server/` 配下

バックエンドの中核です。
この領域は、主に Claude Code で実装・保守する前提です。

---

### `src/server/db/`

#### `prisma.ts`

PrismaClient の生成と共有を行います。

主な役割:

* DB 接続の共通入口
* 開発時の多重接続防止

#### `transactions.ts`

複数更新をまとめてトランザクション実行します。

主な役割:

* raw upsert
* normalized 再生成
* summary 再生成
* audit 記録

これらをまとめて実行し、途中失敗時の不整合を防ぎます。

---

### `src/server/modules/store-config/`

店舗差異を設定データで吸収するためのモジュールです。

#### `types.ts`

店舗設定まわりの型定義です。

主な役割:

* StoreConfig
* PeriodDefinition
* CategoryDefinition
* SeedStoreProfile

#### `repository.ts`

店舗設定の DB アクセス層です。

主な役割:

* stores 取得
* store_reporting_profiles 取得
* categories 取得

#### `service.ts`

店舗設定のユースケース層です。

主な役割:

* フロント表示に適した設定へ整形
* sales / expense のカテゴリ分割
* reportMonths や periodDefinitions の解釈補助

---

### `src/server/modules/finance/`

財務データの入力・正規化・集計を扱う中核モジュールです。

#### `types.ts`

財務ドメイン型を定義します。

主な役割:

* RawRecordInput
* NormalizedRecordDTO
* SummaryDTO
* SummaryFilter

#### `repository.ts`

財務データの DB アクセス層です。

主な役割:

* raw_records の取得・保存
* normalized_records の取得・削除・保存
* summary_records の取得・保存

#### `service.ts`

finance モジュール全体の公開窓口です。

主な役割:

* `getSummary`
* `upsertRawRecord`
* `recalculateStoreYear`
  などのユースケース呼び出しをまとめる

#### `selectors.ts`

取得した財務データを用途別に整形します。

主な役割:

* half ごとの grouping
* sales / expense 合計算出
* グラフや表向けへの変換

---

### `src/server/modules/finance/normalizers/`

このフォルダが「店舗ごとの入力差異を内部統一形式に変換する」中心です。

#### `normalize-raw-records.ts`

正規化処理の入口です。

主な役割:

* profile を見て `CUMULATIVE` / `PERIODIC` の分岐
* 店舗名ではなく設定値ベースで正規化する

#### `normalize-cumulative.ts`

累積入力を期間実績へ変換します。

主な役割:

* current raw - previous raw の差分計算
* 東京・名古屋型の処理
* 累積値逆転などの入力異常検知

#### `normalize-periodic.ts`

期間別入力をそのまま期間実績として扱います。

主な役割:

* 大阪型の処理
* rawAmount を normalized amount に変換

#### `build-summary.ts`

normalized_records から半期サマリを構築します。

主な役割:

* 売上合計算出
* 経費合計算出
* 利益算出
* H1 / H2 summary の生成

---

### `src/server/modules/finance/services/`

ユースケース単位の処理をまとめます。

#### `recalculate-store-year.ts`

指定店舗・年度の再計算をまとめて実行します。

主な役割:

* raw_records 取得
* normalized_records 再生成
* summary_records 再生成
* audit log 記録

#### `upsert-raw-record.ts`

入力保存時の処理を担当します。

主な役割:

* raw record の作成・更新
* バリデーション
* 再計算起動
* audit log 記録

#### `get-summary.ts`

サマリ画面用データ取得を担当します。

主な役割:

* summary の条件検索
* 一覧・グラフ向け DTO の返却

---

### `src/server/modules/excel-import/`

Excel を初期データソースとして取り込むためのモジュールです。
課題の「Excelのデータが入っている状態で起動」に直結する領域です。

#### `parser.ts`

Excel ファイルを読み取ります。

主な役割:

* xlsx 読み込み
* シート取得
* 行データ抽出

#### `mapper.ts`

Excel の行データをアプリ内部形式へ変換します。

主な役割:

* 列名の解釈
* 店舗・カテゴリ・報告月への対応付け
* RawRecordInput へのマッピング

#### `service.ts`

Excel import 全体をオーケストレーションします。

主な役割:

* parser 呼び出し
* mapper 呼び出し
* raw_records への保存
* 再計算起動

---

### `src/server/modules/audit/`

編集履歴を扱うモジュールです。

#### `repository.ts`

監査ログの DB アクセス層です。

主な役割:

* audit_logs の作成
* audit_logs の一覧取得

#### `service.ts`

監査ログのユースケース層です。

主な役割:

* raw record 作成・更新・削除時の記録
* 再計算実行ログの記録
* before / after 値の保持

---

### `src/server/lib/`

#### `zod/`

サーバー入力検証スキーマを配置します。

主な役割:

* API request の validation
* フォームとサーバー間のスキーマ共通化

#### `errors/`

独自エラーを配置します。

主な役割:

* ValidationError
* DomainError
* NotFoundError
* InvalidCumulativeInputError

---

## 5. `src/features/` 配下

画面単位の UI ロジックをまとめる場所です。
主に Codex で改善・調整しやすい領域です。

---

### `src/features/summary/`

サマリ画面に関する UI とフロントロジックです。

#### `components/SummaryTable.tsx`

サマリ表を表示します。

主な役割:

* 年度 / 店舗 / 半期 / 売上合計 / 経費合計 / 利益 の一覧化
* ソートや空状態表示

#### `components/KpiCards.tsx`

KPI カードを表示します。

主な役割:

* 総売上
* 総経費
* 総利益
* 利益率

#### `components/charts/SummaryBarChart.tsx`

棒グラフ表示です。

主な役割:

* 店舗比較
* 利益比較
* 売上 / 経費比較

#### `components/charts/SummaryLineChart.tsx`

折れ線グラフ表示です。

主な役割:

* 時系列推移の表示
* 上期 / 下期や年度変化の確認

#### `components/charts/SummaryStackedBarChart.tsx`

積み上げ棒グラフ表示です。

主な役割:

* 売上内訳表示
* 経費内訳表示
* 店舗差分の把握

#### `hooks/useSummaryQuery.ts`

サマリ取得用のフックです。

主な役割:

* API 呼び出し
* loading / error 管理
* 再取得制御

#### `lib/build-summary-chart-data.ts`

グラフ用データ整形です。

主な役割:

* API レスポンスからチャート共通型へ変換
* Recharts / visx 非依存化

#### `lib/build-summary-table-data.ts`

表用データ整形です。

主な役割:

* 一覧表示用の列順調整
* 数値フォーマット前の構造整形

#### `types.ts`

summary feature 専用型です。

主な役割:

* SummaryRow
* SummaryChartDatum
* KpiCardData

---

### `src/features/data-entry/`

データ登録画面に関する UI とフロントロジックです。

#### `components/StoreSelector.tsx`

店舗選択 UI です。

#### `components/FiscalYearSelector.tsx`

年度選択 UI です。

#### `components/RawRecordForm.tsx`

入力フォームの中心です。

主な役割:

* カテゴリごとの入力欄表示
* reportMonth ごとの入力
* バリデーションエラー表示

#### `components/RawRecordGrid.tsx`

カテゴリ × 報告月の表形式入力です。

主な役割:

* 一覧編集
* 四半期 / 半期の入力レイアウト

#### `components/charts/EntryTrendChart.tsx`

入力画面用の推移グラフです。

主な役割:

* 入力済みデータの推移確認
* 累積 / 期間表示の見え方補助

#### `components/charts/CategoryBreakdownChart.tsx`

カテゴリ内訳グラフです。

主な役割:

* 売上 / 経費カテゴリの比率表示
* 入力結果の視覚確認

#### `hooks/useStoreConfigQuery.ts`

店舗設定取得フックです。

主な役割:

* categories 取得
* inputMode / reportMonths / periodDefinitions 取得

#### `hooks/useRawRecordsMutation.ts`

入力保存フックです。

主な役割:

* raw record 保存 API 呼び出し
* 保存中状態管理
* 保存後再取得

#### `lib/build-entry-chart-data.ts`

入力画面のグラフ用データ整形です。

#### `lib/build-entry-form-schema.ts`

店舗設定からフォーム定義を生成します。

主な役割:

* 入力カテゴリ一覧生成
* reportMonths に応じた入力欄構築
* 将来の店舗追加時に専用 UI を作らず済むようにする

#### `types.ts`

data-entry feature 専用型です。

---

### `src/features/filters/`

サマリ画面の絞り込み UI と、将来の LLM フィルタ連携の受け皿です。

#### `components/SummaryFilterPanel.tsx`

絞り込み UI 全体です。

主な役割:

* 年度
* 店舗
* 半期
* 指標
* 比較軸
* グラフ種別

#### `lib/filter-schema.ts`

絞り込み条件スキーマです。

主な役割:

* SummaryFilter 型の validation
* UI / API / 将来 LLM 出力の共通仕様化

#### `lib/filter-to-query.ts`

フロントのフィルタ状態を API query に変換します。

#### `types.ts`

フィルタ関連型です。

主な役割:

* SummaryFilter
* MetricType
* CompareBy
* ChartType

---

## 6. `src/components/` 配下

再利用可能な汎用 UI とチャート adapter を配置します。

### `src/components/ui/`

共通 UI コンポーネントです。

主な役割:

* Button
* Input
* Select
* Card
* Tabs
* Dialog

### `src/components/layout/`

共通レイアウト部品です。

主な役割:

* Header
* Sidebar
* PageContainer
* SectionHeader

### `src/components/charts/types.ts`

グラフ共通型です。

主な役割:

* BaseChartDatum
* ChartSeries
* ChartProps

### `src/components/charts/index.ts`

現在利用するグラフ adapter の公開窓口です。

主な役割:

* 初期は Recharts を export
* 将来 visx 実装へ切り替える際の接点

### `src/components/charts/adapters/recharts/`

Recharts 実装群です。

主な役割:

* 棒グラフ
* 折れ線グラフ
* 積み上げ棒グラフ

### `src/components/charts/adapters/visx/`

将来の visx 実装群です。

主な役割:

* Recharts からの差し替え先
* 高度なインタラクション対応の受け皿

---

## 7. `src/lib/` 配下

横断利用する小さな共通関数や設定です。

### `src/lib/format/`

表示用フォーマット関数を置きます。

主な役割:

* 金額フォーマット
* 利益率フォーマット
* 半期ラベル整形

### `src/lib/constants/`

共通定数を置きます。

主な役割:

* Half ラベル
* metric 一覧
* chart 種別一覧

### `src/lib/env.ts`

環境変数の取得と validation を行います。

---

## 8. `src/types/` 配下

アプリ全体で横断利用する型を配置します。

### `src/types/api.ts`

API request / response 型です。

### `src/types/chart.ts`

チャート用汎用型です。

### `src/types/domain.ts`

ドメイン共通型です。

主な役割:

* Store
* Category
* RawRecord
* NormalizedRecord
* SummaryRecord

---

## 9. `prisma/` 配下

DB スキーマと seed 定義です。
この領域はデータ整合性の要なので、主に Claude Code 側で管理します。

### `prisma/schema.prisma`

Prisma スキーマ本体です。

主な役割:

* `stores`
* `store_reporting_profiles`
* `categories`
* `raw_records`
* `normalized_records`
* `summary_records`
* `audit_logs`

### `prisma/seed.ts`

seed 実行エントリです。

主な役割:

* master data 投入
* raw sample 投入
* 初期正規化・半期集計の実行

### `prisma/seed/master-data.ts`

店舗設定とカテゴリ定義を持ちます。

主な役割:

* 東京 / 大阪 / 名古屋の初期設定
* `inputMode`
* `reportMonths`
* `periodDefinitions`
* `categories`

### `prisma/seed/raw-records.sample.ts`

初期 raw データのサンプルです。

主な役割:

* 起動直後に表示されるデータの元
* ローカル開発用サンプル

---

## 10. `scripts/` 配下

CLI 実行用の補助スクリプトです。

### `scripts/import-excel.ts`

Excel から raw_records を作成するスクリプトです。

主な役割:

* xlsx 読み込み
* mapper 変換
* DB 保存
* 再計算起動

### `scripts/export-seed-json.ts`

seed / debug 用の JSON 出力スクリプトです。

主な役割:

* Excel 取り込み結果の確認
* seed データ比較
* テスト用出力

---

## 11. `docs/` 配下

課題の補足説明と設計意図をまとめる場所です。
課題の任意要件で求められている「設計意図や要件理解について説明したドキュメント」に対応します。

### `docs/requirements.md`

要件定義書です。

### `docs/architecture.md`

全体設計書です。

### `docs/data-model.md`

データモデル設計書です。

### `docs/normalization-rules.md`

正規化ルール仕様書です。

### `docs/api-design.md`

API 設計書です。

### `docs/tech-stack.md`

技術構成と採用理由です。

---

## 12. Claude Code / Codex の担当分離

### Claude Code で主に触る領域

* `prisma/**`
* `src/server/**`
* `scripts/**`
* `docs/**`
* `app/api/**`

主な目的:

* データモデル設計
* 正規化ロジック
* 集計ロジック
* Excel import
* API 実装
* ドキュメント整備

### Codex で主に触る領域

* `src/features/**`
* `src/components/ui/**`
* `src/components/charts/**`
* `app/(dashboard)/**`

主な目的:

* 画面の見やすさ改善
* グラフ UI 改善
* レスポンシブ調整
* レイアウト改善

---

## 13. この構成の狙い

この構成は、以下を同時に満たすことを狙っています。

1. 課題の本質である「データ処理の正確さ」を `src/server/modules/finance` に集中させる
2. 店舗差異を `store_reporting_profiles` と `categories` で吸収し、店舗追加時に専用ロジックを避ける
3. 入力データと集計データを `raw_records` / `normalized_records` / `summary_records` で分離し、責務を明確にする
4. Excel 初期投入を `scripts/import-excel.ts` と `prisma/seed.ts` で支え、起動時に Excel 由来データが見える状態を作る
5. 将来の visx 差し替えや LLM フィルタ追加に耐える拡張性を持たせる

---

## 14. 補足

* `raw_records` は入力値の原本を保持するため、監査や再計算の起点になります
* `normalized_records` は比較・集計のための内部標準形式です
* `summary_records` は半期一覧・KPI表示のための高速参照用です
* `periodDefinitions` を設定化しているため、東京・大阪・名古屋以外の店舗追加にも対応しやすい設計です
* グラフは feature 側で直接 Recharts に依存せず、共通 adapter を経由することで visx に差し替えやすくしています

```

