import type { StoreCode } from "@/src/types/domain";

type Props = {
  stores: Array<{ code: StoreCode; name: string }>;
  value: StoreCode;
  onChange: (value: StoreCode) => void;
};

export function StoreSelector({ stores, value, onChange }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {stores.map((store) => (
        <button
          key={store.code}
          type="button"
          onClick={() => onChange(store.code)}
          className={`rounded-[1.35rem] border px-4 py-4 text-left transition ${
            value === store.code
              ? "border-[var(--ink)] bg-[var(--ink)] text-white shadow-[0_18px_40px_rgba(24,34,47,0.18)]"
              : "border-[var(--line)] bg-white/80 text-[var(--ink)] hover:border-[rgba(14,116,144,0.25)] hover:bg-white"
          }`}
        >
          <p className="text-base font-semibold">{store.name}</p>
          <p className={`mt-1 text-xs uppercase tracking-[0.14em] ${value === store.code ? "text-white/72" : "text-[var(--muted)]"}`}>
            {store.code}
          </p>
        </button>
      ))}
    </div>
  );
}
