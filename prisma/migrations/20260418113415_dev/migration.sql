-- CreateEnum
CREATE TYPE "InputMode" AS ENUM ('CUMULATIVE', 'PERIODIC');

-- CreateEnum
CREATE TYPE "CategoryKind" AS ENUM ('SALES', 'EXPENSE');

-- CreateEnum
CREATE TYPE "RecordSourceType" AS ENUM ('EXCEL_SEED', 'MANUAL_EDIT', 'IMPORT');

-- CreateEnum
CREATE TYPE "Half" AS ENUM ('H1', 'H2');

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_reporting_profiles" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "inputMode" "InputMode" NOT NULL,
    "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1,
    "reportMonths" INTEGER[],
    "periodDefinitions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_reporting_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "CategoryKind" NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_records" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "reportMonth" INTEGER NOT NULL,
    "periodCode" TEXT NOT NULL,
    "inputModeSnapshot" "InputMode" NOT NULL,
    "rawAmount" DECIMAL(14,2) NOT NULL,
    "sourceType" "RecordSourceType" NOT NULL,
    "sourceFileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "raw_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "normalized_records" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "normalizedPeriodCode" TEXT NOT NULL,
    "half" "Half" NOT NULL,
    "coveredMonths" INTEGER[],
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "normalized_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "normalized_record_raw_records" (
    "normalizedRecordId" TEXT NOT NULL,
    "rawRecordId" TEXT NOT NULL,

    CONSTRAINT "normalized_record_raw_records_pkey" PRIMARY KEY ("normalizedRecordId","rawRecordId")
);

-- CreateTable
CREATE TABLE "summary_records" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "half" "Half" NOT NULL,
    "salesTotal" DECIMAL(14,2) NOT NULL,
    "expenseTotal" DECIMAL(14,2) NOT NULL,
    "profit" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "summary_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "storeId" TEXT,
    "fiscalYear" INTEGER,
    "categoryId" TEXT,
    "reportMonth" INTEGER,
    "action" TEXT NOT NULL,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stores_code_key" ON "stores"("code");

-- CreateIndex
CREATE UNIQUE INDEX "store_reporting_profiles_storeId_key" ON "store_reporting_profiles"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_storeId_code_key" ON "categories"("storeId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_storeId_name_key" ON "categories"("storeId", "name");

-- CreateIndex
CREATE INDEX "raw_records_storeId_fiscalYear_idx" ON "raw_records"("storeId", "fiscalYear");

-- CreateIndex
CREATE INDEX "raw_records_storeId_fiscalYear_reportMonth_idx" ON "raw_records"("storeId", "fiscalYear", "reportMonth");

-- CreateIndex
CREATE UNIQUE INDEX "raw_records_storeId_fiscalYear_categoryId_reportMonth_key" ON "raw_records"("storeId", "fiscalYear", "categoryId", "reportMonth");

-- CreateIndex
CREATE INDEX "normalized_records_storeId_fiscalYear_half_idx" ON "normalized_records"("storeId", "fiscalYear", "half");

-- CreateIndex
CREATE INDEX "normalized_records_storeId_fiscalYear_normalizedPeriodCode_idx" ON "normalized_records"("storeId", "fiscalYear", "normalizedPeriodCode");

-- CreateIndex
CREATE UNIQUE INDEX "normalized_records_storeId_fiscalYear_categoryId_normalized_key" ON "normalized_records"("storeId", "fiscalYear", "categoryId", "normalizedPeriodCode");

-- CreateIndex
CREATE INDEX "summary_records_fiscalYear_half_idx" ON "summary_records"("fiscalYear", "half");

-- CreateIndex
CREATE UNIQUE INDEX "summary_records_storeId_fiscalYear_half_key" ON "summary_records"("storeId", "fiscalYear", "half");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_storeId_fiscalYear_idx" ON "audit_logs"("storeId", "fiscalYear");

-- AddForeignKey
ALTER TABLE "store_reporting_profiles" ADD CONSTRAINT "store_reporting_profiles_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_records" ADD CONSTRAINT "raw_records_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_records" ADD CONSTRAINT "raw_records_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_records" ADD CONSTRAINT "normalized_records_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_records" ADD CONSTRAINT "normalized_records_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_record_raw_records" ADD CONSTRAINT "normalized_record_raw_records_normalizedRecordId_fkey" FOREIGN KEY ("normalizedRecordId") REFERENCES "normalized_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_record_raw_records" ADD CONSTRAINT "normalized_record_raw_records_rawRecordId_fkey" FOREIGN KEY ("rawRecordId") REFERENCES "raw_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "summary_records" ADD CONSTRAINT "summary_records_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
