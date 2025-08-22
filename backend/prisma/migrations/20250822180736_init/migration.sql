-- CreateTable
CREATE TABLE "Submission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "message" TEXT,
    "resumeData" BYTEA,
    "resumeContentType" TEXT,
    "resumeOriginalName" TEXT,
    "resumeSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_submission_email" ON "Submission"("email");

-- CreateIndex
CREATE INDEX "idx_submission_created_at" ON "Submission"("createdAt");
