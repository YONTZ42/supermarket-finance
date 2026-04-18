import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.22),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.18),_transparent_30%),linear-gradient(180deg,_#f4f6ef_0%,_#eef4ff_100%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center gap-10 px-6 py-14 sm:px-10 lg:flex-row lg:items-center lg:justify-between">
        <section className="max-w-2xl">
          <p className="inline-flex rounded-full border border-[var(--line)] bg-white/80 px-4 py-1 text-sm font-medium text-[var(--muted)] shadow-sm backdrop-blur">
            Supermarket Finance Console
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[var(--ink)] sm:text-6xl">
            店舗差異を吸収しながら、
            <span className="block text-[var(--accent-strong)]">
              半期の業績を一画面で把握する。
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-[var(--muted)] sm:text-lg">
            東京・大阪・名古屋で異なる入力ルールを統一し、経営層が比較しやすい形で売上・経費・利益を可視化します。
            現在は seed 由来のモックデータでフロントエンドを先行実装しています。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="primary-action" href="/summary">
              サマリを見る
            </Link>
            <Link className="secondary-action" href="/data-entry">
              データ登録へ
            </Link>
          </div>
        </section>

        <section className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
          <article className="panel p-6 sm:col-span-2">
            <p className="eyebrow">経営レポート</p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl font-semibold">上期・下期比較</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  店舗別の利益差とカテゴリ構成を同じ軸で確認できます。
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--accent-soft)] px-4 py-2 text-sm font-medium text-[var(--accent-strong)]">
                3 Stores
              </div>
            </div>
            <div className="mt-6 grid grid-cols-6 gap-2">
              {[68, 84, 73, 90, 78, 96].map((height, index) => (
                <div
                  key={index}
                  className="rounded-t-2xl bg-[linear-gradient(180deg,_rgba(14,116,144,0.8),_rgba(14,116,144,0.32))]"
                  style={{ height: `${height * 1.3}px` }}
                />
              ))}
            </div>
          </article>

          <article className="panel p-6">
            <p className="eyebrow">入力運用</p>
            <h2 className="mt-3 text-xl font-semibold">店舗ごとの入力差を視認化</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              累積入力と期間入力をルール付きで表示し、誤入力を減らす前提で設計します。
            </p>
          </article>

          <article className="panel p-6">
            <p className="eyebrow">モック連携</p>
            <h2 className="mt-3 text-xl font-semibold">API shape を壊さず先行開発</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              Prisma seed を元にしたモック層で UI/UX を詰め、後から server 実装へ差し替えます。
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
