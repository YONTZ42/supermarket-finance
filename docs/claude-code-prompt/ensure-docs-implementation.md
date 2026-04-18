実装済みコードと docs の齟齬をなくしてください。

対象:
- docs/requirements.md
- docs/architecture.md
- docs/data-model.md
- docs/normalization-rules.md
- docs/api-design.md
- docs/tech-stack.md
- README.md

目的:
コード・スキーマ・seed・API とドキュメントが一致している状態にする。

観点:
- raw_records / normalized_records / summary_records の責務
- store_reporting_profiles と categories による店舗差異吸収
- cumulative / periodic の正規化ルール
- Excel 初期投入の扱い
- Claude Code / Codex の担当境界
- Recharts → visx 差し替え前提
- LLM は後付けで filter JSON 生成のみ

重要:
- 実装されていないことを docs に書きすぎない
- 実装済みのことだけを事実ベースで反映する
- README は採点者が最初に読む想定で、簡潔かつ導線が良い形にする

出力:
- 更新ファイル一覧
- 主要な修正点
- ドキュメントと実装の整合ポイント