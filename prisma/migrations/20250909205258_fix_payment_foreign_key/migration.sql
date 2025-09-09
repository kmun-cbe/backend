-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_registrationId_fkey";

-- AlterTable
ALTER TABLE "registration_forms" ADD COLUMN     "allocatedCommittee" TEXT,
ADD COLUMN     "allocatedPortfolio" TEXT;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registration_forms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
