import type { PeriodDefinition } from "@/src/server/modules/store-config/types";
import type { RawRecordSlice, NormalizedInput } from "@/src/server/modules/finance/types";
import { normalizePeriodic } from "./normalize-periodic";
import { normalizeCumulative } from "./normalize-cumulative";

/**
 * 正規化処理の入口。
 * inputMode に基づいて PERIODIC / CUMULATIVE を振り分ける。
 * store 名では分岐しない。
 */
export function normalizeRawRecords(
  raws: RawRecordSlice[],
  inputMode: "CUMULATIVE" | "PERIODIC",
  periodDefinitions: PeriodDefinition[],
  storeId: string,
  fiscalYear: number,
): NormalizedInput[] {
  const sortedPDs = [...periodDefinitions].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );

  if (inputMode === "PERIODIC") {
    return normalizePeriodic(raws, sortedPDs, storeId, fiscalYear);
  }

  return normalizeCumulative(raws, sortedPDs, storeId, fiscalYear);
}
