-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SOFTWARE_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'REGISTRATION_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'ALLOCATION_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'EXECUTIVE_BOARD';
ALTER TYPE "UserRole" ADD VALUE 'PARTICIPANT';
