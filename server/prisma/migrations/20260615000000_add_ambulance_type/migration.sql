-- CreateEnum
CREATE TYPE "AmbulanceType" AS ENUM ('basic', 'advanced', 'icu');

-- AlterTable
ALTER TABLE "Request" ADD COLUMN "ambulanceType" "AmbulanceType" NOT NULL DEFAULT 'basic';
