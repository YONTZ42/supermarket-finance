import { Fragment } from "react";

import type { EntryGridValue } from "@/src/features/data-entry/types";
import type { StoreConfig } from "@/src/types/domain";
import { formatCurrency } from "@/src/lib/format/finance";

type Props = {
  rows: EntryGridValue[];
  store: StoreConfig;
  onChange: (nextRows: EntryGridValue[]) => void;
};

export function RawRecordGrid({ rows, store, onChange }: Props) {
  function updateValue(categoryCode: string, periodCode: string, nextValue: string) {
    const sanitized = nextValue.replace(/[^\d.-]/g, "");
    const parsed = Number(sanitized);

    onChange(
      rows.map((row) =>
        row.categoryCode === categoryCode
          ? {
              ...row,
              valuesByPeriod: {
                ...row.valuesByPeriod,
                [periodCode]: Number.isFinite(parsed) ? parsed : 0,
              },
            }
          : row,
      ),
    );
  }

  const groupedRows = [
    {
      label: "売上カテゴリ",
      tone: "sales",
      rows: rows.filter((row) => row.kind === "SALES"),
    },
    {
      label: "経費カテゴリ",
      tone: "expense",
      rows: rows.filter((row) => row.kind === "EXPENSE"),
    },
  ];

  return (
    <div className="data-grid-shell">
      <div className="overflow-x-auto">
        <table className="financial-table min-w-[980px]">
          <thead>
            <tr>
              <th>カテゴリ</th>
              <th>入力種別</th>
              {store.periodDefinitions.map((period) => (
                <th key={period.code}>
                  <div className="space-y-1">
                    <p>{period.code}</p>
                    <p className="text-[10px] font-medium normal-case tracking-normal text-[var(--muted)]">
                      {period.coveredMonths[0]}-{period.coveredMonths[period.coveredMonths.length - 1]}月 / {period.reportMonth}月報告
                    </p>
                  </div>
                </th>
              ))}
              <th>合計</th>
            </tr>
          </thead>
          <tbody>
            {groupedRows.map((group) => (
              group.rows.length > 0 ? (
                <Fragment key={group.label}>
                  <tr className={group.tone === "sales" ? "bg-emerald-50/70" : "bg-amber-50/70"}>
                    <td colSpan={store.periodDefinitions.length + 3}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{group.label}</span>
                        <span className="text-xs text-[var(--muted)]">
                          {group.rows.length} categories
                        </span>
                      </div>
                    </td>
                  </tr>
                  {group.rows.map((row) => {
                    const rowTotal = Object.values(row.valuesByPeriod).reduce((sum, value) => sum + value, 0);

                    return (
                      <tr key={row.categoryCode}>
                        <td>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{row.categoryName}</p>
                              {row.isCustom ? <span className="status-badge status-muted">仮項目</span> : null}
                            </div>
                            <p className="mt-1 text-xs text-[var(--muted)]">{row.categoryCode}</p>
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${row.kind === "SALES" ? "status-good" : "status-warn"}`}>
                            {row.kind === "SALES" ? "売上" : "経費"}
                          </span>
                        </td>
                        {store.periodDefinitions.map((period) => (
                          <td key={`${row.categoryCode}-${period.code}`}>
                            <input
                              className="financial-input min-w-[132px]"
                              inputMode="numeric"
                              placeholder="0"
                              value={String(row.valuesByPeriod[period.code] ?? 0)}
                              onChange={(event) =>
                                updateValue(row.categoryCode, period.code, event.target.value)
                              }
                            />
                          </td>
                        ))}
                        <td className="font-mono text-sm">{formatCurrency(rowTotal)}</td>
                      </tr>
                    );
                  })}
                </Fragment>
              ) : null
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
