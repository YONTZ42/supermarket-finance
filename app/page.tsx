import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f5f4ed_0%,_#eef4ff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16 sm:px-10">
        <div className="panel rounded-[2rem] p-8 sm:p-10">
          <p className="text-sm font-medium text-[var(--muted)]">Supermarket Finance Console</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-4xl">
            経営管理ダッシュボード
          </h1>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="primary-action" href="/summary">
              サマリ
            </Link>
            <Link className="secondary-action" href="/data-entry">
              データ登録
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
