-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatutBail" ADD VALUE 'ANNULE';
ALTER TYPE "StatutBail" ADD VALUE 'SUSPENDU';

-- CreateTable
CREATE TABLE "EvolutionBail" (
    "id" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "nouveauLoyerMensuel" DECIMAL(65,30) NOT NULL,
    "dateEffet" TIMESTAMP(3) NOT NULL,
    "applique" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvolutionBail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EvolutionBail" ADD CONSTRAINT "EvolutionBail_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "Bail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
