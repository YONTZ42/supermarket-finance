あなたはこのリポジトリのバックエンド担当です。
この課題では、店舗ごとに異なる決算データ管理方式を統合し、半期（上期・下期）ごとの売上合計・経費合計・利益を全店舗共通フォーマットで比較できるようにする必要があります。

前提要件:
- React / Next.js ベースのアプリである
- 店舗ごとの管理画面とサマリ画面が必要
- Excelのデータが入っている状態で起動できる必要がある
- 東京は 3,6,9,12 月の累積入力
- 大阪は 3,6,9,12 月の期間別入力
- 名古屋は 6,12 月の累積入力
- 東京・名古屋の累積データは差分計算で期間実績へ変換する
- 店舗追加時に専用ロジックを極力書かずに済む構造にしたい

設計方針:
- 入力原本は raw_records に保持する
- 比較・集計用の内部標準形式は normalized_records に保持する
- 半期サマリは summary_records に保持またはそこに準じて取得する
- 店舗差異は store_reporting_profiles と categories の設定で吸収する
- Excel は seed/import で初期投入する
- LLM は後付けで、計算はさせず絞り込み条件生成専用にする
- グラフは初期は Recharts、後から visx に差し替え可能な adapter 構成にする
- 今回あなたはフロントの見た目改善ではなく、バックエンド・データモデル・正規化ロジック・API・設計書整備を担当する

既存前提:
- prisma/schema.prisma
- prisma/seed.ts
- prisma/seed/master-data.ts
- prisma/seed/raw-records.sample.ts
- src/server/modules/**
- scripts/import-excel.ts
- docs/requirements.md
- docs/architecture.md
- docs/data-model.md
- docs/normalization-rules.md
- docs/api-design.md
- docs/tech-stack.md
- docs/directory-files-explanation.md
を参照しながら進めること

重要ルール:
- store 名で if 分岐しないこと
- inputMode と periodDefinitions に基づいて処理すること
- raw_records → normalized_records → summary_records の責務を崩さないこと
- 変更したファイルごとに「変更理由」「責務」「影響範囲」を簡潔に説明すること
- まずは最小差分で進めること
- UI 側の都合で server 側の責務を曖昧にしないこと
- すでにファイルは作成済み、ファイルの新規作成はしてはいけない。docs/directory-tree.mdやその他docs/内設計資料を基に、既存ファイルの書き込み/修正に徹して。
今回のタスク:
1. まず既存の prisma schema / docs / server modules を読んで、現状理解を要約する
2. 次に不足しているバックエンド実装を洗い出す。特に"@/src/server/modules/finance/services/recalculate-store-year"の実装を優先。
3. その後、優先順位順に最小差分で実装する
4. 実装ごとに、追加・変更したファイル一覧と意図をまとめる
5. フロントエンドで必要になる API response shape も壊れないように配慮する

最初の出力では、
- 現状理解
- 不足実装一覧
- 実装順序
- 最初に触るファイル
を整理してから作業を始めてください。
整理が終わったら、/src/server/modules/finance/services/recalculate-store-year.tsのみ実装してください。