バックエンド API を実装してください。

対象:
- app/api/stores/route.ts
- app/api/finance/summary/route.ts
- app/api/finance/raw-records/route.ts
- 必要なら app/api/finance/import-excel/route.ts

目的:
フロントエンドが、
- 店舗設定を取得できる
- raw record を登録・更新できる
- summary を取得できる
状態にする

要件:
- 店舗設定 API は stores + reporting profile + categories を返す
- raw-records API は upsert と再計算を行う
- summary API は年度・店舗・半期などの filter を受けて summary を返す
- request/response の shape は将来の UI 改善で扱いやすいように安定させる
- validation は zod を使う
- エラー時は意味のあるレスポンスを返す

参照:
- src/server/modules/store-config/**
- src/server/modules/finance/**
- src/server/lib/zod/**
- docs/api-design.md
- docs/requirements.md

重要:
- フロント都合で DB モデルをそのまま露出しすぎない
- DTO を意識する
- API route にビジネスロジックを直接書かず service を呼ぶ

出力:
- 変更ファイル一覧
- API ごとの request / response 概要
- 今後 Codex が使うときの注意点