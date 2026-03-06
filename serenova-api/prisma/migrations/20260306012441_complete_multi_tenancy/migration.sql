-- AlterTable
ALTER TABLE "Alerte" ADD COLUMN     "organisationId" TEXT;

-- AlterTable
ALTER TABLE "Bail" ADD COLUMN     "organisationId" TEXT;

-- AlterTable
ALTER TABLE "Paiement" ADD COLUMN     "organisationId" TEXT;

-- AddForeignKey
ALTER TABLE "Bail" ADD CONSTRAINT "Bail_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerte" ADD CONSTRAINT "Alerte_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
