import type { SeedStoreProfile } from "@/src/server/modules/store-config/types";

export const storeProfiles: SeedStoreProfile[] = [
  {
    store: { code: "TOKYO", name: "東京" },
    reportingProfile: {
      inputMode: "CUMULATIVE",
      fiscalYearStartMonth: 1,
      reportMonths: [3, 6, 9, 12],
      periodDefinitions: [
        { code: "Q1", reportMonth: 3, coveredMonths: [1, 2, 3], half: "H1", displayOrder: 1 },
        { code: "Q2", reportMonth: 6, coveredMonths: [4, 5, 6], half: "H1", displayOrder: 2 },
        { code: "Q3", reportMonth: 9, coveredMonths: [7, 8, 9], half: "H2", displayOrder: 3 },
        { code: "Q4", reportMonth: 12, coveredMonths: [10, 11, 12], half: "H2", displayOrder: 4 },
      ],
    },
    categories: [
      { code: "fresh_food", name: "生鮮食品", kind: "SALES", displayOrder: 1 },
      { code: "processed_food", name: "加工食品", kind: "SALES", displayOrder: 2 },
      { code: "sweets", name: "菓子", kind: "SALES", displayOrder: 3 },
      { code: "drinks", name: "飲料", kind: "SALES", displayOrder: 4 },
      { code: "deli", name: "惣菜", kind: "SALES", displayOrder: 5 },
      { code: "labor", name: "人件費", kind: "EXPENSE", displayOrder: 101 },
      { code: "utilities", name: "水道光熱費", kind: "EXPENSE", displayOrder: 102 },
      { code: "advertising", name: "広告宣伝費", kind: "EXPENSE", displayOrder: 103 },
      { code: "logistics", name: "物流費", kind: "EXPENSE", displayOrder: 104 },
      { code: "other_expense", name: "その他経費", kind: "EXPENSE", displayOrder: 105 },
    ],
  },
  {
    store: { code: "OSAKA", name: "大阪" },
    reportingProfile: {
      inputMode: "PERIODIC",
      fiscalYearStartMonth: 1,
      reportMonths: [3, 6, 9, 12],
      periodDefinitions: [
        { code: "Q1", reportMonth: 3, coveredMonths: [1, 2, 3], half: "H1", displayOrder: 1 },
        { code: "Q2", reportMonth: 6, coveredMonths: [4, 5, 6], half: "H1", displayOrder: 2 },
        { code: "Q3", reportMonth: 9, coveredMonths: [7, 8, 9], half: "H2", displayOrder: 3 },
        { code: "Q4", reportMonth: 12, coveredMonths: [10, 11, 12], half: "H2", displayOrder: 4 },
      ],
    },
    categories: [
      { code: "sweets", name: "菓子", kind: "SALES", displayOrder: 1 },
      { code: "drinks", name: "飲料", kind: "SALES", displayOrder: 2 },
      { code: "toys", name: "おもちゃ", kind: "SALES", displayOrder: 3 },
      { code: "daily_goods", name: "日用品", kind: "SALES", displayOrder: 4 },
      { code: "labor", name: "人件費", kind: "EXPENSE", displayOrder: 101 },
      { code: "advertising", name: "広告宣伝費", kind: "EXPENSE", displayOrder: 102 },
      { code: "logistics", name: "物流費", kind: "EXPENSE", displayOrder: 103 },
      { code: "other_expense", name: "その他経費", kind: "EXPENSE", displayOrder: 104 },
      { code: "sgna", name: "販管費", kind: "EXPENSE", displayOrder: 105 },
    ],
  },
  {
    store: { code: "NAGOYA", name: "名古屋" },
    reportingProfile: {
      inputMode: "CUMULATIVE",
      fiscalYearStartMonth: 1,
      reportMonths: [6, 12],
      periodDefinitions: [
        { code: "H1", reportMonth: 6, coveredMonths: [1, 2, 3, 4, 5, 6], half: "H1", displayOrder: 1 },
        { code: "H2", reportMonth: 12, coveredMonths: [7, 8, 9, 10, 11, 12], half: "H2", displayOrder: 2 },
      ],
    },
    categories: [
      { code: "fresh_food", name: "生鮮食品", kind: "SALES", displayOrder: 1 },
      { code: "sweets", name: "菓子", kind: "SALES", displayOrder: 2 },
      { code: "drinks", name: "飲料", kind: "SALES", displayOrder: 3 },
      { code: "deli", name: "惣菜", kind: "SALES", displayOrder: 4 },
      { code: "daily_goods", name: "日用品", kind: "SALES", displayOrder: 5 },
      { code: "labor", name: "人件費", kind: "EXPENSE", displayOrder: 101 },
      { code: "advertising", name: "広告宣伝費", kind: "EXPENSE", displayOrder: 102 },
      { code: "logistics", name: "物流費", kind: "EXPENSE", displayOrder: 103 },
      { code: "other_expense", name: "その他経費", kind: "EXPENSE", displayOrder: 104 },
      { code: "misc", name: "雑費", kind: "EXPENSE", displayOrder: 105 },
    ],
  },
];