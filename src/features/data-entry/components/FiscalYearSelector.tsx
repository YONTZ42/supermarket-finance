"use client";

import { useState } from "react";

type Props = {
  fiscalYears: number[];
  value: number;
  onChange: (value: number) => void;
  onAddYear: (value: number) => void;
};

export function FiscalYearSelector({ fiscalYears, value, onChange, onAddYear }: Props) {
  const [draftYear, setDraftYear] = useState("");

  function handleAddYear() {
    const parsed = Number(draftYear);
    if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
      return;
    }

    onAddYear(parsed);
    setDraftYear("");
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        {fiscalYears.map((fiscalYear) => (
          <button
            key={fiscalYear}
            type="button"
            onClick={() => onChange(fiscalYear)}
            className={`rounded-[1.2rem] border px-4 py-4 text-left transition ${
              value === fiscalYear
                ? "border-[var(--accent-strong)] bg-[var(--accent-strong)] text-white"
                : "border-[var(--line)] bg-white/80 text-[var(--ink)] hover:border-[rgba(14,116,144,0.25)] hover:bg-white"
            }`}
          >
            <p className="text-base font-semibold">{fiscalYear}年度</p>
            <p className={`mt-1 text-xs uppercase tracking-[0.14em] ${value === fiscalYear ? "text-white/72" : "text-[var(--muted)]"}`}>
              Fiscal Year
            </p>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 rounded-[1.2rem] border border-dashed border-[var(--line)] bg-white/70 p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <p className="text-sm font-semibold">新規年度を追加</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            既存データがなくても空の入力欄を作成できます。
          </p>
        </div>
        <div className="flex gap-2">
          <input
            className="financial-input w-[132px]"
            inputMode="numeric"
            placeholder="2025"
            value={draftYear}
            onChange={(event) => setDraftYear(event.target.value)}
          />
          <button type="button" className="secondary-action" onClick={handleAddYear}>
            年度追加
          </button>
        </div>
      </div>
    </div>
  );
}
