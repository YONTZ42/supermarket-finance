以下を優先して実装してください。

目的:
データ処理の正確さを最優先し、 raw_records → normalized_records → summary_records の流れを成立させる。

参照対象:
- prisma/schema.prisma
- prisma/seed.ts
- prisma/seed/master-data.ts
- prisma/seed/raw-records.sample.ts
- docs/architecture.md
- docs/data-model.md
- docs/normalization-rules.md

実装タスク:
1. Prisma schema の整合確認
2. stores / store_reporting_profiles / categories / raw_records / normalized_records / summary_records / audit_logs の関係整理
3. seed が master data と raw sample を投入し、その後 recalculateStoreYear を呼ぶ流れを成立させる
4. recalculateStoreYear を中核に、
   - periodic はそのまま期間実績へ
   - cumulative は前回 raw との差分で期間実績へ
   - half summary を生成
する処理を成立させる
5. 必要なら不足型や不足 service を追加する

制約:
- store 名で if 分岐しない
- inputMode / periodDefinitions を使う
- 既存ディレクトリ責務を崩さない
- UI はまだ触らない
- 実装後に、テスト観点を箇条書きで出す

出力形式:
- 変更ファイル一覧
- 各ファイルの変更意図
- 実装内容
- 未対応事項