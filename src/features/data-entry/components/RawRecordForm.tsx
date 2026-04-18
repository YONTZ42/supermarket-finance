import {
  buildEntryModeGuidance,
  buildReportingHints,
} from "@/src/features/data-entry/lib/build-entry-form-schema";
import type { EntryGridValue } from "@/src/features/data-entry/types";
import type { StoreConfig } from "@/src/types/domain";
import { RawRecordGrid } from "@/src/features/data-entry/components/RawRecordGrid";

type Props = {
  store: StoreConfig;
  rows: EntryGridValue[];
  onChange: (nextRows: EntryGridValue[]) => void;
  onSubmit: () => void;
  isSaving: boolean;
};

export function RawRecordForm({ store, rows, onChange, onSubmit, isSaving }: Props) {
  const reportingHints = buildReportingHints(store);
  const modeGuidance = buildEntryModeGuidance(store);

  return (
    <section className="space-y-5">
      <article className="panel rounded-[1.75rem] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="eyebrow">Entry Rules</p>
            <h2 className="mt-1 text-xl font-semibold">{store.name} の入力プロファイル</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              {modeGuidance.description}
            </p>
          </div>
          <button
            type="button"
            className="primary-action"
            onClick={onSubmit}
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "入力内容を保存"}
          </button>
        </div>
        <div
          className={`mt-5 rounded-[1.5rem] border px-5 py-4 ${
            modeGuidance.tone === "cumulative"
              ? "border-cyan-200 bg-cyan-50/80"
              : "border-amber-200 bg-amber-50/80"
          }`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="eyebrow">{modeGuidance.title}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--ink)]">{modeGuidance.guard}</p>
            </div>
            <div className="grid gap-2 text-sm text-[var(--muted)]">
              <span>報告月: {store.reportMonths.join(" / ")} 月</span>
              <span>入力列: {store.periodDefinitions.map((period) => period.code).join(" / ")}</span>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {reportingHints.map((hint) => (
            <div key={hint.code} className="rounded-[1.25rem] border border-[var(--line)] bg-white/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{hint.code}</p>
                <span className="status-badge status-muted">{hint.half}</span>
              </div>
              <p className="mt-3 text-sm text-[var(--ink)]">{hint.label}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {hint.inputMode === "CUMULATIVE" ? "累積値を入力" : "期間実績を入力"}
              </p>
            </div>
          ))}
        </div>
      </article>

      <RawRecordGrid rows={rows} store={store} onChange={onChange} />
    </section>
  );
}
