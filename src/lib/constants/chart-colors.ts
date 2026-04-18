/**
 * アプリ全体で統一するチャート配色。
 * グラフの棒・折れ線・ボタン・凡例が同じ色を参照する。
 */

/** 店舗コード → ブランドカラー */
export const STORE_COLORS: Record<string, string> = {
  TOKYO: "#2563eb",   // blue-600
  OSAKA: "#0f766e",   // teal-700
  NAGOYA: "#b45309",  // amber-700
};

export const STORE_COLOR_DEFAULT = "#6366f1"; // indigo-500

/** 店舗コードからカラーを取得 */
export function getStoreColor(code: string): string {
  return STORE_COLORS[code] ?? STORE_COLOR_DEFAULT;
}

/** P/L モードの系列カラー */
export const PL_COLORS = {
  sales: "#0f766e",    // teal
  expense: "#dc2626",  // red
  profit: "#2563eb",   // blue
} as const;

/** カテゴリ内訳用パレット（最大 15 カテゴリ） */
export const CATEGORY_PALETTE = [
  "#0ea5e9", // sky-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-400
  "#8b5cf6", // violet-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#a855f7", // purple-500
  "#ec4899", // pink-500
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#eab308", // yellow-500
  "#7c3aed", // violet-700
  "#dc2626", // red-600
] as const;

export function getCategoryColor(index: number): string {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}
