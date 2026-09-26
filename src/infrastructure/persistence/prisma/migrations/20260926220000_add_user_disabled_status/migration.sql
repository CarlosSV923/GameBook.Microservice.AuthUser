-- AlterTable
ALTER TABLE "auth"."User"
ADD COLUMN "isDisabled" BOOLEAN NOT NULL DEFAULT false;
