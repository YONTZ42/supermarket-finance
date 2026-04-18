import type { EntryGridValue } from "@/src/features/data-entry/types";

function getRowMap(rows: EntryGridValue[]) {
  return new Map(rows.map((row) => [row.categoryCode, row]));
}

export function buildDirtyEntryRows(
  baseRows: EntryGridValue[],
  currentRows: EntryGridValue[],
): EntryGridValue[] {
  const baseRowMap = getRowMap(baseRows);
  const dirtyRows: EntryGridValue[] = [];

  for (const row of currentRows) {
    if (row.isCustom) {
      continue;
    }

    const baseRow = baseRowMap.get(row.categoryCode);
    const dirtyValues = Object.entries(row.valuesByPeriod).reduce<Record<string, number>>(
      (accumulator, [periodCode, value]) => {
        const baseValue = baseRow?.valuesByPeriod[periodCode] ?? 0;

        if (value !== baseValue) {
          accumulator[periodCode] = value;
        }

        return accumulator;
      },
      {},
    );

    if (Object.keys(dirtyValues).length === 0) {
      continue;
    }

    dirtyRows.push({
      ...row,
      valuesByPeriod: dirtyValues,
    });
  }

  return dirtyRows;
}

export function buildSelectableFiscalYears(
  existingYears: number[],
  currentYear: number,
  extraYears: number[],
) {
  const anchorYears = [...existingYears, ...extraYears, currentYear];
  const minYear = Math.min(...anchorYears, currentYear - 2);
  const maxYear = Math.max(...anchorYears, currentYear + 2);
  const years: number[] = [];

  for (let year = minYear; year <= maxYear; year += 1) {
    years.push(year);
  }

  return years;
}
