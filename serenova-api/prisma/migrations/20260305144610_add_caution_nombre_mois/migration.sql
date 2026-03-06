-- AlterTable
ALTER TABLE "Bail" ADD COLUMN     "cautionNombreMois" INTEGER,
ADD COLUMN     "montantCaution" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Loyer" ADD COLUMN     "cautionNombreMois" INTEGER DEFAULT 1,
ALTER COLUMN "caution" DROP NOT NULL,
ALTER COLUMN "devise" SET DEFAULT 'FCFA';
