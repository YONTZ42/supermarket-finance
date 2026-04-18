import { formatCurrency, formatHalfLabel, formatPercent } from "@/src/lib/format/finance";
import type { SummaryRow } from "@/src/features/summary/types";

type Props = {
  rows: SummaryRow[];
};

export function SummaryTable({ rows }: Props) {
  return (
    <div className="data-grid-shell">
      <div className="overflow-x-auto">
        <table className="financial-table min-w-full">
          <thead>
            <tr>
              <th>年度</th>
              <th>店舗</th>
              <th>半期</th>
              <th>売上合計</th>
              <th>経費合計</th>
              <th>利益</th>
              <th>利益率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.storeCode}-${row.fiscalYear}-${row.half}`}>
                <td>{row.fiscalYear}</td>
                <td>{row.storeName}</td>
                <td>{formatHalfLabel(row.half)}</td>
                <td>{formatCurrency(row.salesTotal)}</td>
                <td>{formatCurrency(row.expenseTotal)}</td>
                <td className={row.profit >= 0 ? "text-emerald-700" : "text-rose-700"}>
                  {formatCurrency(row.profit)}
                </td>
                <td>{formatPercent(row.marginRate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
