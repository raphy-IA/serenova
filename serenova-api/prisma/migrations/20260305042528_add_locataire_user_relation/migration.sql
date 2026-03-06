-- AlterTable
ALTER TABLE "Locataire" ADD COLUMN     "userId" TEXT;

-- AddForeignKey
ALTER TABLE "Locataire" ADD CONSTRAINT "Locataire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
