-- AlterTable
ALTER TABLE "Bail" ADD COLUMN     "loyerMensuel" DECIMAL(65,30),
ADD COLUMN     "nbMoisAvance" INTEGER DEFAULT 1;
