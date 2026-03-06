/*
  Warnings:

  - A unique constraint covering the columns `[nom]` on the table `Organisation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PeriodicitePlan" AS ENUM ('MENSUEL', 'ANNUEL');

-- CreateEnum
CREATE TYPE "SubscriptionStatut" AS ENUM ('ACTIF', 'SUSPENDU', 'EXPIRE', 'RESILIE');

-- CreateEnum
CREATE TYPE "TypeOrganisation" AS ENUM ('SOCIETE', 'INDIVIDU');

-- CreateEnum
CREATE TYPE "TypeAnnouncement" AS ENUM ('INFO', 'WARNING', 'MAINTENANCE', 'SUCCESS');

-- CreateEnum
CREATE TYPE "TypeTemplate" AS ENUM ('CONTRAT_BAIL', 'QUITTANCE_LOYER', 'ETAT_DES_LIEUX', 'MISE_EN_DEMEURE', 'RECU_PAIEMENT');

-- CreateEnum
CREATE TYPE "SaaSInvoiceStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SaaSPaymentMethod" AS ENUM ('MANUAL', 'STRIPE', 'PAYPAL', 'MOBILE_MONEY');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPPORT';

-- AlterTable
ALTER TABLE "Organisation" ADD COLUMN     "type" "TypeOrganisation" NOT NULL DEFAULT 'SOCIETE';

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "organisationId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prix" DECIMAL(65,30) NOT NULL,
    "periodicite" "PeriodicitePlan" NOT NULL DEFAULT 'MENSUEL',
    "limites" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "statut" "SubscriptionStatut" NOT NULL DEFAULT 'ACTIF',
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),
    "autoRenouvellement" BOOLEAN NOT NULL DEFAULT true,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "TypeAnnouncement" NOT NULL DEFAULT 'INFO',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTemplate" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" "TypeTemplate" NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT true,
    "organisationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaaSConfig" (
    "id" TEXT NOT NULL,
    "stripePublicKey" TEXT,
    "stripeSecretKey" TEXT,
    "stripeWebhookSecret" TEXT,
    "momoApiKey" TEXT,
    "momoApiSecret" TEXT,
    "momoMerchantId" TEXT,
    "paypalClientId" TEXT,
    "paypalSecret" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "SaaSConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaaSInvoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" "SaaSInvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "SaaSPaymentMethod",
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaaSInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaaSTransaction" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentMethod" "SaaSPaymentMethod" NOT NULL,
    "status" TEXT NOT NULL,
    "reference" TEXT,
    "providerPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaaSTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_nom_key" ON "Plan"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organisationId_key" ON "Subscription"("organisationId");

-- CreateIndex
CREATE UNIQUE INDEX "SaaSInvoice_reference_key" ON "SaaSInvoice"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Organisation_nom_key" ON "Organisation"("nom");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTemplate" ADD CONSTRAINT "DocumentTemplate_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaaSConfig" ADD CONSTRAINT "SaaSConfig_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaaSInvoice" ADD CONSTRAINT "SaaSInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaaSInvoice" ADD CONSTRAINT "SaaSInvoice_organisationId_fkey" FOREIGN KEY ("organisationId") REFERENCES "Organisation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaaSTransaction" ADD CONSTRAINT "SaaSTransaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SaaSInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
