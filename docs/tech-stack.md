# 技術構成

## フレームワーク
- Next.js 16.2.4 (App Router)
- React 19
- TypeScript 5 (strict mode)

## スタイル
- Tailwind CSS 4

## バックエンド
- Next.js Route Handlers
- Zod 4（リクエストバリデーション）
- Prisma 7（ORM）

## データベース
- PostgreSQL（Neon）
- `@neondatabase/serverless` + `@prisma/adapter-neon`

## Excel インポート
- xlsx 0.18.5（Excel パーサー）
- CLI: `scripts/import-excel.ts`
- API: `POST /api/finance/import-excel`
- Prisma seed (`prisma/seed.ts`)

## 未導入（将来導入予定）
- Recharts（グラフ表示、初期実装）
- visx（グラフ表示、Recharts からの差し替え候補）
- shadcn/ui（UI コンポーネント）
- Vercel AI SDK / LLM（フィルタ条件生成専用、計算はさせない）

## 担当分離

| 領域 | 担当 | 主な対象 |
|---|---|---|
| データモデル・正規化・API | Claude Code | `prisma/`, `src/server/`, `app/api/`, `scripts/`, `docs/` |
| 画面 UI・グラフ・レイアウト | Codex | `src/features/`, `src/components/`, `app/(dashboard)/` |
