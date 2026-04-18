type Props = {
  fiscalYears: number[];
  value: number;
  onChange: (value: number) => void;
};

export function FiscalYearSelector({ fiscalYears, value, onChange }: Props) {
  return (
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
  );
}
