-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'GESTIONNAIRE', 'LECTEUR');

-- CreateEnum
CREATE TYPE "TypeSite" AS ENUM ('RESIDENTIEL', 'COMMERCIAL', 'MIXTE', 'VILLA', 'ETUDIANT', 'IMMEUBLE_RAPPORT');

-- CreateEnum
CREATE TYPE "StatutSite" AS ENUM ('ACTIF', 'INACTIF', 'EN_TRAVAUX');

-- CreateEnum
CREATE TYPE "TypeEspace" AS ENUM ('STUDIO', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6_PLUS', 'BUREAU', 'LOCAL_COMMERCIAL', 'ENTREPOT', 'PARKING', 'VILLA', 'CHAMBRE');

-- CreateEnum
CREATE TYPE "TypeCuisine" AS ENUM ('OUVERTE', 'FERMEE', 'KITCHENETTE', 'AUCUNE');

-- CreateEnum
CREATE TYPE "TypeMeuble" AS ENUM ('NON_MEUBLE', 'MEUBLE', 'SEMI_MEUBLE');

-- CreateEnum
CREATE TYPE "EtatGeneral" AS ENUM ('EXCELLENT', 'BON', 'MOYEN', 'A_RENOVER');

-- CreateEnum
CREATE TYPE "StatutEspace" AS ENUM ('LIBRE', 'OCCUPE', 'RESERVE', 'EN_TRAVAUX');

-- CreateEnum
CREATE TYPE "TypeCharges" AS ENUM ('INCLUSES', 'PROVISION', 'REELLES');

-- CreateEnum
CREATE TYPE "Periodicite" AS ENUM ('MENSUELLE', 'TRIMESTRIELLE', 'ANNUELLE');

-- CreateEnum
CREATE TYPE "TypePenalite" AS ENUM ('TAUX_FIXE', 'MONTANT_JOUR', 'AUCUNE');

-- CreateEnum
CREATE TYPE "Civilite" AS ENUM ('M', 'MME', 'SOCIETE');

-- CreateEnum
CREATE TYPE "StatutBail" AS ENUM ('ACTIF', 'EXPIRE', 'RESILIE');

-- CreateEnum
CREATE TYPE "TypePaiement" AS ENUM ('LOYER', 'CAUTION', 'AVANCE', 'FRAIS_ENTREE', 'PENALITE', 'AUTRE');

-- CreateEnum
CREATE TYPE "ModePaiement" AS ENUM ('ESPECES', 'VIREMENT', 'CHEQUE', 'MOBILE_MONEY', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutPaiement" AS ENUM ('VALIDE', 'ANNULE');

-- CreateEnum
CREATE TYPE "TypeAlerte" AS ENUM ('IMPAYE', 'BAIL_EXPIRANT', 'CAUTION_MANQUANTE', 'ASSURANCE_EXPIRANTE', 'ESPACE_VACANT');

-- CreateEnum
CREATE TYPE "StatutAlerte" AS ENUM ('EN_ATTENTE', 'ENVOYEE', 'RESOLUE', 'IGNOREE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'GESTIONNAIRE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeSite" NOT NULL,
    "adresse" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "codePostal" TEXT NOT NULL,
    "pays" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "nbEspaces" INTEGER NOT NULL,
    "anneeConstruction" INTEGER,
    "surface" DOUBLE PRECISION,
    "nbEtages" INTEGER,
    "ascenseur" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "statut" "StatutSite" NOT NULL DEFAULT 'ACTIF',
    "photos" TEXT[],
    "description" TEXT,
    "gestionnaire" TEXT,
    "assuranceCompagnie" TEXT,
    "assuranceRef" TEXT,
    "assuranceExpiration" TIMESTAMP(3),
    "equipements" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Espace" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "identifiant" TEXT NOT NULL,
    "label" TEXT,
    "type" "TypeEspace" NOT NULL,
    "etage" INTEGER,
    "numeroPorce" TEXT,
    "surface" DOUBLE PRECISION,
    "surfaceTotale" DOUBLE PRECISION,
    "nbPieces" INTEGER,
    "nbChambres" INTEGER,
    "nbSallesBain" INTEGER,
    "cuisine" "TypeCuisine",
    "balcon" BOOLEAN NOT NULL DEFAULT false,
    "exposition" TEXT,
    "chauffage" TEXT,
    "meuble" "TypeMeuble" NOT NULL DEFAULT 'NON_MEUBLE',
    "etatGeneral" "EtatGeneral" NOT NULL DEFAULT 'BON',
    "equipements" TEXT[],
    "photos" TEXT[],
    "statut" "StatutEspace" NOT NULL DEFAULT 'LIBRE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Espace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loyer" (
    "id" TEXT NOT NULL,
    "espaceId" TEXT NOT NULL,
    "montantBase" DECIMAL(65,30) NOT NULL,
    "charges" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "typeCharges" "TypeCharges" NOT NULL DEFAULT 'INCLUSES',
    "caution" DECIMAL(65,30) NOT NULL,
    "moisAvance" INTEGER NOT NULL DEFAULT 1,
    "devise" TEXT NOT NULL DEFAULT 'EUR',
    "periodicite" "Periodicite" NOT NULL DEFAULT 'MENSUELLE',
    "jourEcheance" INTEGER NOT NULL DEFAULT 5,
    "indexation" BOOLEAN NOT NULL DEFAULT false,
    "indexIndice" TEXT,
    "indexPourcentage" DECIMAL(65,30),
    "delaiGrace" INTEGER NOT NULL DEFAULT 5,
    "typePenalite" "TypePenalite" NOT NULL DEFAULT 'TAUX_FIXE',
    "penaliteTaux" DECIMAL(65,30),
    "penaliteMontant" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loyer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Locataire" (
    "id" TEXT NOT NULL,
    "civilite" "Civilite" NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "raisonSociale" TEXT,
    "dateNaissance" TIMESTAMP(3),
    "nationalite" TEXT,
    "pieceIdentite" TEXT,
    "numIdentite" TEXT,
    "photoIdentite" TEXT,
    "telephone" TEXT NOT NULL,
    "telephoneSecondaire" TEXT,
    "email" TEXT,
    "employeur" TEXT,
    "revenus" DECIMAL(65,30),
    "garant" JSONB,
    "documents" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Locataire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bail" (
    "id" TEXT NOT NULL,
    "espaceId" TEXT NOT NULL,
    "locataireId" TEXT NOT NULL,
    "dateEntree" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "dureesMois" INTEGER,
    "renouvellementAuto" BOOLEAN NOT NULL DEFAULT true,
    "preivisMois" INTEGER NOT NULL DEFAULT 1,
    "dateSortie" TIMESTAMP(3),
    "motifSortie" TEXT,
    "pdfBail" TEXT,
    "statut" "StatutBail" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "typePaiement" "TypePaiement" NOT NULL,
    "moisConcerne" TIMESTAMP(3),
    "montant" DECIMAL(65,30) NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL,
    "modePaiement" "ModePaiement" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "quittancePdf" TEXT,
    "statut" "StatutPaiement" NOT NULL DEFAULT 'VALIDE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerte" (
    "id" TEXT NOT NULL,
    "bailId" TEXT NOT NULL,
    "type" "TypeAlerte" NOT NULL,
    "message" TEXT NOT NULL,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "dateSent" TIMESTAMP(3),
    "statut" "StatutAlerte" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alerte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Loyer_espaceId_key" ON "Loyer"("espaceId");

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Espace" ADD CONSTRAINT "Espace_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loyer" ADD CONSTRAINT "Loyer_espaceId_fkey" FOREIGN KEY ("espaceId") REFERENCES "Espace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bail" ADD CONSTRAINT "Bail_espaceId_fkey" FOREIGN KEY ("espaceId") REFERENCES "Espace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bail" ADD CONSTRAINT "Bail_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Locataire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "Bail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerte" ADD CONSTRAINT "Alerte_bailId_fkey" FOREIGN KEY ("bailId") REFERENCES "Bail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
