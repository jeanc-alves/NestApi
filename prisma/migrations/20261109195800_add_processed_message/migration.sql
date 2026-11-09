-- CreateTable
CREATE TABLE "ProcessedMessage" (
    "id" TEXT NOT NULL,
    "queue" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedMessage_pkey" PRIMARY KEY ("id")
);
