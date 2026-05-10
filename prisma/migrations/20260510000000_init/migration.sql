-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PLAYER');

-- CreateEnum
CREATE TYPE "PlayerKind" AS ENUM ('SUBSCRIBER', 'WAITLIST');

-- CreateEnum
CREATE TYPE "SignupStatus" AS ENUM ('IN', 'OUT', 'WAITLIST');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NONE', 'PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'STRIKER', 'ANY');

-- CreateEnum
CREATE TYPE "TeamColor" AS ENUM ('BLUE', 'RED', 'WHITE', 'BLACK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nickname" TEXT,
    "avatarUrl" TEXT,
    "kind" "PlayerKind" NOT NULL DEFAULT 'SUBSCRIBER',
    "rank" INTEGER NOT NULL DEFAULT 0,
    "paypalName" TEXT,
    "paypalLink" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "overall" INTEGER NOT NULL DEFAULT 50,
    "technique" INTEGER NOT NULL DEFAULT 50,
    "speed" INTEGER NOT NULL DEFAULT 50,
    "stamina" INTEGER NOT NULL DEFAULT 50,
    "defense" INTEGER NOT NULL DEFAULT 50,
    "offense" INTEGER NOT NULL DEFAULT 50,
    "passing" INTEGER NOT NULL DEFAULT 50,
    "shooting" INTEGER NOT NULL DEFAULT 50,
    "goalkeeping" INTEGER NOT NULL DEFAULT 20,
    "position" "Position" NOT NULL DEFAULT 'ANY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 90,
    "location" TEXT,
    "notes" TEXT,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "teamCount" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signup" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" "SignupStatus" NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NONE',
    "paymentNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" "TeamColor" NOT NULL,
    "avgOverall" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDefense" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgOffense" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgSpeed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSlot" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "position" "Position" NOT NULL DEFAULT 'ANY',

    CONSTRAINT "TeamSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Player_userId_key" ON "Player"("userId");

-- CreateIndex
CREATE INDEX "Player_kind_rank_idx" ON "Player"("kind", "rank");

-- CreateIndex
CREATE INDEX "Match_date_idx" ON "Match"("date");

-- CreateIndex
CREATE INDEX "Signup_matchId_status_rank_idx" ON "Signup"("matchId", "status", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Signup_matchId_playerId_key" ON "Signup"("matchId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_matchId_color_key" ON "Team"("matchId", "color");

-- CreateIndex
CREATE INDEX "TeamSlot_teamId_idx" ON "TeamSlot"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSlot_teamId_playerId_key" ON "TeamSlot"("teamId", "playerId");

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signup" ADD CONSTRAINT "Signup_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signup" ADD CONSTRAINT "Signup_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSlot" ADD CONSTRAINT "TeamSlot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSlot" ADD CONSTRAINT "TeamSlot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.3 -> 7.8.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

