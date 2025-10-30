-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNLISTED');

-- CreateEnum
CREATE TYPE "BuildStatus" AS ENUM ('PENDING', 'BUILDING', 'SUCCESS', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "ownerWallet" TEXT NOT NULL,
    "programId" TEXT,
    "network" TEXT NOT NULL DEFAULT 'devnet',
    "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC',
    "starsCount" INTEGER NOT NULL DEFAULT 0,
    "forksCount" INTEGER NOT NULL DEFAULT 0,
    "buildsCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[],
    "language" TEXT NOT NULL DEFAULT 'rust',
    "framework" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastBuiltAt" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFile" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'rust',
    "size" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Build" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "BuildStatus" NOT NULL DEFAULT 'PENDING',
    "buildNumber" INTEGER NOT NULL,
    "logs" TEXT,
    "artifacts" TEXT,
    "errorMsg" TEXT,
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "duration" INTEGER,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Build_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Star" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Star_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fork" (
    "id" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "forkedProjectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fork_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_programId_key" ON "Project"("programId");

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");

-- CreateIndex
CREATE INDEX "Project_ownerWallet_idx" ON "Project"("ownerWallet");

-- CreateIndex
CREATE INDEX "Project_programId_idx" ON "Project"("programId");

-- CreateIndex
CREATE INDEX "Project_visibility_idx" ON "Project"("visibility");

-- CreateIndex
CREATE INDEX "Project_createdAt_idx" ON "Project"("createdAt");

-- CreateIndex
CREATE INDEX "ProjectFile_projectId_idx" ON "ProjectFile"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFile_projectId_path_key" ON "ProjectFile"("projectId", "path");

-- CreateIndex
CREATE INDEX "Build_projectId_idx" ON "Build"("projectId");

-- CreateIndex
CREATE INDEX "Build_status_idx" ON "Build"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Build_projectId_buildNumber_key" ON "Build"("projectId", "buildNumber");

-- CreateIndex
CREATE INDEX "Star_userId_idx" ON "Star"("userId");

-- CreateIndex
CREATE INDEX "Star_projectId_idx" ON "Star"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Star_userId_projectId_key" ON "Star"("userId", "projectId");

-- CreateIndex
CREATE INDEX "Fork_originalId_idx" ON "Fork"("originalId");

-- CreateIndex
CREATE INDEX "Fork_forkedProjectId_idx" ON "Fork"("forkedProjectId");

-- CreateIndex
CREATE INDEX "Fork_userId_idx" ON "Fork"("userId");

-- AddForeignKey
ALTER TABLE "ProjectFile" ADD CONSTRAINT "ProjectFile_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Build" ADD CONSTRAINT "Build_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Star" ADD CONSTRAINT "Star_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fork" ADD CONSTRAINT "Fork_originalId_fkey" FOREIGN KEY ("originalId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
