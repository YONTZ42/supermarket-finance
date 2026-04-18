import { formatCompactCurrency, formatPercent } from "@/src/lib/format/finance";
import type { KpiCardData } from "@/src/features/summary/types";

type Props = {
  cards: KpiCardData[];
};

export function KpiCards({ cards }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.id} className="panel rounded-[1.5rem] p-5">
          <p className="eyebrow">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold">
            {card.id === "margin-rate"
              ? formatPercent(card.value)
              : formatCompactCurrency(card.value)}
          </p>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{card.helper}</p>
        </article>
      ))}
    </div>
  );
}
