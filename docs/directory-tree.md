supermarket-finance/
├─ app/
│  ├─ (dashboard)/
│  │  ├─ summary/
│  │  │  └─ page.tsx
│  │  ├─ data-entry/
│  │  │  └─ page.tsx
│  │  └─ layout.tsx
│  ├─ api/
│  │  ├─ stores/route.ts
│  │  ├─ finance/
│  │  │  ├─ summary/route.ts
│  │  │  ├─ raw-records/route.ts
│  │  │  └─ import-excel/route.ts
│  ├─ layout.tsx
│  └─ page.tsx
│
├─ src/
│  ├─ server/
│  │  ├─ db/
│  │  │  ├─ prisma.ts
│  │  │  └─ transactions.ts
│  │  ├─ modules/
│  │  │  ├─ store-config/
│  │  │  │  ├─ repository.ts
│  │  │  │  ├─ service.ts
│  │  │  │  └─ types.ts
│  │  │  ├─ finance/
│  │  │  │  ├─ repository.ts
│  │  │  │  ├─ service.ts
│  │  │  │  ├─ types.ts
│  │  │  │  ├─ selectors.ts
│  │  │  │  ├─ normalizers/
│  │  │  │  │  ├─ normalize-raw-records.ts
│  │  │  │  │  ├─ normalize-cumulative.ts
│  │  │  │  │  ├─ normalize-periodic.ts
│  │  │  │  │  └─ build-summary.ts
│  │  │  │  └─ services/
│  │  │  │     ├─ recalculate-store-year.ts
│  │  │  │     ├─ upsert-raw-record.ts
│  │  │  │     └─ get-summary.ts
│  │  │  ├─ excel-import/
│  │  │  │  ├─ parser.ts
│  │  │  │  ├─ mapper.ts
│  │  │  │  └─ service.ts
│  │  │  └─ audit/
│  │  │     ├─ repository.ts
│  │  │     └─ service.ts
│  │  └─ lib/
│  │     ├─ zod/
│  │     └─ errors/
│  │
│  ├─ features/
│  │  ├─ summary/
│  │  │  ├─ components/
│  │  │  │  ├─ SummaryTable.tsx
│  │  │  │  ├─ KpiCards.tsx
│  │  │  │  ├─ charts/
│  │  │  │  │  ├─ SummaryBarChart.tsx
│  │  │  │  │  ├─ SummaryLineChart.tsx
│  │  │  │  │  └─ SummaryStackedBarChart.tsx
│  │  │  ├─ hooks/
│  │  │  │  └─ useSummaryQuery.ts
│  │  │  ├─ lib/
│  │  │  │  ├─ build-summary-chart-data.ts
│  │  │  │  └─ build-summary-table-data.ts
│  │  │  └─ types.ts
│  │  │
│  │  ├─ data-entry/
│  │  │  ├─ components/
│  │  │  │  ├─ StoreSelector.tsx
│  │  │  │  ├─ FiscalYearSelector.tsx
│  │  │  │  ├─ RawRecordForm.tsx
│  │  │  │  ├─ RawRecordGrid.tsx
│  │  │  │  └─ charts/
│  │  │  │     ├─ EntryTrendChart.tsx
│  │  │  │     └─ CategoryBreakdownChart.tsx
│  │  │  ├─ hooks/
│  │  │  │  ├─ useStoreConfigQuery.ts
│  │  │  │  └─ useRawRecordsMutation.ts
│  │  │  ├─ lib/
│  │  │  │  ├─ build-entry-chart-data.ts
│  │  │  │  └─ build-entry-form-schema.ts
│  │  │  └─ types.ts
│  │  │
│  │  └─ filters/
│  │     ├─ components/
│  │     │  └─ SummaryFilterPanel.tsx
│  │     ├─ lib/
│  │     │  ├─ filter-schema.ts
│  │     │  └─ filter-to-query.ts
│  │     └─ types.ts
│  │
│  ├─ components/
│  │  ├─ ui/
│  │  ├─ charts/
│  │  │  ├─ adapters/
│  │  │  │  ├─ recharts/
│  │  │  │  │  ├─ BarChartAdapter.tsx
│  │  │  │  │  ├─ LineChartAdapter.tsx
│  │  │  │  │  └─ StackedBarChartAdapter.tsx
│  │  │  │  └─ visx/
│  │  │  │     ├─ BarChartAdapter.tsx
│  │  │  │     ├─ LineChartAdapter.tsx
│  │  │  │     └─ StackedBarChartAdapter.tsx
│  │  │  ├─ types.ts
│  │  │  └─ index.ts
│  │  └─ layout/
│  │
│  ├─ lib/
│  │  ├─ format/
│  │  ├─ constants/
│  │  └─ env.ts
│  │
│  └─ types/
│     ├─ api.ts
│     ├─ chart.ts
│     └─ domain.ts
│
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ seed/
│     ├─ master-data.ts
│     └─ raw-records.sample.ts
│
├─ scripts/
│  ├─ import-excel.ts
│  └─ export-seed-json.ts
│
├─ docs/
│  ├─ requirements.md
│  ├─ architecture.md
│  ├─ data-model.md
│  ├─ normalization-rules.md
│  ├─ api-design.md
│  └─ tech-stack.md
│
├─ public/
├─ package.json
├─ tsconfig.json
└─ README.md