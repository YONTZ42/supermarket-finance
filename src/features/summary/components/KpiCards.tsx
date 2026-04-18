import { formatCompactCurrency, formatPercent } from "@/src/lib/format/finance";
import type { KpiCardData } from "@/src/features/summary/types";

type Props = {
  cards: KpiCardData[];
};

const CARD_STYLES: Record<string, { accent: string; icon: string }> = {
  "sales-total": { accent: "#0e7490", icon: "↑" },
  "expense-total": { accent: "#b45309", icon: "↓" },
  "profit-total": { accent: "#2563eb", icon: "=" },
  "margin-rate": { accent: "#166534", icon: "%" },
};

export function KpiCards({ cards }: Props) {
  return (
    <div className="grid gap-3 grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const style = CARD_STYLES[card.id];
        const isRate = card.id === "margin-rate";
        const formatted = isRate
          ? formatPercent(card.value)
          : formatCompactCurrency(card.value);

        return (
          <article
            key={card.id}
            className="panel rounded-[1.25rem] px-4 py-3 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: style?.accent ? `${style.accent}20` : undefined,
                  color: style?.accent,
                }}
              >
                {style?.icon}
              </span>
              <p className="text-xs text-[var(--muted)] truncate">{card.label}</p>
            </div>
            <p
              className="text-xl font-semibold tracking-tight tabular-nums shrink-0"
              style={{ color: card.value < 0 && !isRate ? "#dc2626" : style?.accent }}
            >
              {formatted}
            </p>
          </article>
        );
      })}
    </div>
  );
}
