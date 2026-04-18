import type { Half, InputMode } from "@/src/types/domain";

const currencyFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("ja-JP", {
  notation: "compact",
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 1,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatHalfLabel(half: Half) {
  return half === "H1" ? "上期" : "下期";
}

export function formatInputMode(mode: InputMode) {
  return mode === "CUMULATIVE" ? "累積入力" : "期間入力";
}

export function formatPeriodLabel(reportMonth: number, months: number[]) {
  if (months.length === 3) {
    return `${months[0]}-${months[2]}月 / ${reportMonth}月報告`;
  }

  return `${months[0]}-${months[months.length - 1]}月 / ${reportMonth}月報告`;
}
