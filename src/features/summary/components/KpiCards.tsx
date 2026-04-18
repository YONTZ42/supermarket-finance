import { formatCompactCurrency, formatPercent } from "@/src/lib/format/finance";
import type { KpiCardData } from "@/src/features/summary/types";

type Props = {
  cards: KpiCardData[];
};

const CARD_STYLES: Record<string, { bg: string; accent: string; icon: string }> = {
  "sales-total": {
    bg: "linear-gradient(135deg, rgba(14,116,144,0.08), rgba(14,116,144,0.04))",
    accent: "#0e7490",
    icon: "↑",
  },
  "expense-total": {
    bg: "linear-gradient(135deg, rgba(217,119,6,0.08), rgba(217,119,6,0.04))",
    accent: "#b45309",
    icon: "↓",
  },
  "profit-total": {
    bg: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(37,99,235,0.04))",
    accent: "#2563eb",
    icon: "=",
  },
  "margin-rate": {
    bg: "linear-gradient(135deg, rgba(22,101,52,0.08), rgba(22,101,52,0.04))",
    accent: "#166534",
    icon: "%",
  },
};

export function KpiCards({ cards }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const style = CARD_STYLES[card.id];
        const isRate = card.id === "margin-rate";
        const formatted = isRate
          ? formatPercent(card.value)
          : formatCompactCurrency(card.value);

        return (
          <article
            key={card.id}
            className="panel rounded-[1.5rem] p-5 overflow-hidden relative"
            style={{ background: style?.bg }}
          >
            {/* Decorative circle */}
            <div
              className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10"
              style={{ background: style?.accent }}
            />

            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="eyebrow">{card.label}</p>
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: style?.accent ? `${style.accent}20` : undefined,
                    color: style?.accent,
                  }}
                >
                  {style?.icon}
                </span>
              </div>

              <p
                className="mt-3 text-3xl font-semibold tracking-tight"
                style={{ color: card.value < 0 && !isRate ? "#dc2626" : undefined }}
              >
                {formatted}
              </p>

              <p className="mt-2 text-xs leading-5 text-[var(--muted)] line-clamp-2">
                {card.helper}
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
