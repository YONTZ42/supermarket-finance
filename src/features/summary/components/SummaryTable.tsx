import { formatCurrency, formatHalfLabel, formatPercent } from "@/src/lib/format/finance";
import type { SummaryRow } from "@/src/features/summary/types";

type Props = {
  rows: SummaryRow[];
};

export function SummaryTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="data-grid-shell flex items-center justify-center p-8 text-sm text-[var(--muted)]">
        表示するデータがありません
      </div>
    );
  }

  return (
    <div className="data-grid-shell">
      <div className="overflow-x-auto">
        <table className="financial-table min-w-full">
          <thead>
            <tr>
              <th>年度</th>
              <th>半期</th>
              <th>店舗</th>
              <th className="text-right">売上合計</th>
              <th className="text-right">経費合計</th>
              <th className="text-right">利益</th>
              <th className="text-right">利益率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isPositive = row.profit >= 0;
              return (
                <tr
                  key={`${row.storeCode}-${row.fiscalYear}-${row.half}`}
                  className="hover:bg-[var(--accent-soft)] transition-colors"
                >
                  <td className="font-medium">{row.fiscalYear}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        row.half === "H1" ? "status-muted" : "status-good"
                      }`}
                    >
                      {formatHalfLabel(row.half)}
                    </span>
                  </td>
                  <td className="font-medium">{row.storeName}</td>
                  <td className="text-right font-mono text-sm">
                    {formatCurrency(row.salesTotal)}
                  </td>
                  <td className="text-right font-mono text-sm text-amber-700">
                    {formatCurrency(row.expenseTotal)}
                  </td>
                  <td
                    className={`text-right font-mono text-sm font-semibold ${
                      isPositive ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {formatCurrency(row.profit)}
                  </td>
                  <td className="text-right">
                    <span
                      className={`status-badge ${
                        row.marginRate >= 10
                          ? "status-good"
                          : row.marginRate >= 0
                          ? "status-muted"
                          : "status-warn"
                      }`}
                    >
                      {formatPercent(row.marginRate)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
