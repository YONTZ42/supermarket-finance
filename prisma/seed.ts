import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, InputMode, CategoryKind, RecordSourceType } from "@prisma/client";

import { storeProfiles } from "./seed/master-data";
import { rawRecordSamples } from "./seed/raw-records.sample";
import { recalculateStoreYear } from "@/src/server/modules/finance/services/recalculate-store-year";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in .env");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const profile of storeProfiles) {
    const store = await prisma.store.upsert({
      where: { code: profile.store.code },
      update: { name: profile.store.name, isActive: true },
      create: { code: profile.store.code, name: profile.store.name, isActive: true },
    });

    await prisma.storeReportingProfile.upsert({
      where: { storeId: store.id },
      update: {
        inputMode: profile.reportingProfile.inputMode as InputMode,
        fiscalYearStartMonth: profile.reportingProfile.fiscalYearStartMonth,
        reportMonths: profile.reportingProfile.reportMonths,
        periodDefinitions: profile.reportingProfile.periodDefinitions,
      },
      create: {
        storeId: store.id,
        inputMode: profile.reportingProfile.inputMode as InputMode,
        fiscalYearStartMonth: profile.reportingProfile.fiscalYearStartMonth,
        reportMonths: profile.reportingProfile.reportMonths,
        periodDefinitions: profile.reportingProfile.periodDefinitions,
      },
    });

    for (const category of profile.categories) {
      await prisma.category.upsert({
        where: {
          storeId_code: {
            storeId: store.id,
            code: category.code,
          },
        },
        update: {
          name: category.name,
          kind: category.kind as CategoryKind,
          displayOrder: category.displayOrder,
          isActive: true,
        },
        create: {
          storeId: store.id,
          code: category.code,
          name: category.name,
          kind: category.kind as CategoryKind,
          displayOrder: category.displayOrder,
          isActive: true,
        },
      });
    }
  }

  for (const raw of rawRecordSamples) {
    const store = await prisma.store.findUniqueOrThrow({
      where: { code: raw.storeCode },
    });

    const category = await prisma.category.findUniqueOrThrow({
      where: {
        storeId_code: {
          storeId: store.id,
          code: raw.categoryCode,
        },
      },
    });

    await prisma.rawRecord.upsert({
      where: {
        storeId_fiscalYear_categoryId_reportMonth: {
          storeId: store.id,
          fiscalYear: raw.fiscalYear,
          categoryId: category.id,
          reportMonth: raw.reportMonth,
        },
      },
      update: {
        periodCode: raw.periodCode,
        inputModeSnapshot: raw.inputModeSnapshot as InputMode,
        rawAmount: raw.rawAmount,
        sourceType: raw.sourceType as RecordSourceType,
        sourceFileName: raw.sourceFileName,
      },
      create: {
        storeId: store.id,
        fiscalYear: raw.fiscalYear,
        categoryId: category.id,
        reportMonth: raw.reportMonth,
        periodCode: raw.periodCode,
        inputModeSnapshot: raw.inputModeSnapshot as InputMode,
        rawAmount: raw.rawAmount,
        sourceType: raw.sourceType as RecordSourceType,
        sourceFileName: raw.sourceFileName,
      },
    });
  }

  const fiscalYears = [...new Set(rawRecordSamples.map((r) => `${r.storeCode}-${r.fiscalYear}`))];

  for (const item of fiscalYears) {
    const [storeCode, yearText] = item.split("-");
    const fiscalYear = Number(yearText);
    const store = await prisma.store.findUniqueOrThrow({ where: { code: storeCode } });
    await recalculateStoreYear(prisma, { storeId: store.id, fiscalYear });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
