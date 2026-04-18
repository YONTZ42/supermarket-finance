Excel 初期投入まわりを実装してください。

目的:
「Excelのデータが入っている状態で起動できること」を満たすため、Excel を初期データソースとして扱えるようにする。

対象:
- scripts/import-excel.ts
- src/server/modules/excel-import/parser.ts
- src/server/modules/excel-import/mapper.ts
- src/server/modules/excel-import/service.ts
- README.md
- docs/requirements.md
- docs/api-design.md（必要なら）
- docs/architecture.md（必要なら）

要件:
- Excel ファイルを読み込めること
- 行データを raw_records 相当へ変換できること
- 取り込み後に recalculateStoreYear を実行できること
- README に import 手順を書けること
- 毎回実行時に Excel を直接読まなくてもよい。seed/import で初期投入できればよい
- 実装は最小でよいが、あとで拡張できる構造にすること

重要:
- parser は「読むだけ」
- mapper は「アプリ内部型へ変換するだけ」
- service は「保存と再計算を行う」
- 責務を混ぜないこと

出力:
- 変更ファイル一覧
- import 手順
- Excel 側に依存する前提
- 想定されるエラーケース