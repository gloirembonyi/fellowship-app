CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "role" TEXT NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Application" (
  "id" TEXT PRIMARY KEY,
  "updatedAt" TIMESTAMP NOT NULL,
  "countryOfResidence" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "workplace" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "educationLevel" TEXT NOT NULL,
  "otherEducation" TEXT,
  "professionalContext" TEXT NOT NULL,
  "otherContext" TEXT,
  "expectedContribution" TEXT NOT NULL,
  "otherContribution" TEXT,
  "projectType" TEXT NOT NULL,
  "projectArea" TEXT NOT NULL,
  "otherProjectArea" TEXT,
  "projectSummary" TEXT NOT NULL,
  "projectMotivation" TEXT NOT NULL,
  "cvFileUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "email" TEXT UNIQUE NOT NULL,
  "firstName" TEXT NOT NULL,
  "gender" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "middleName" TEXT,
  "nationality" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rejectionReason" TEXT,
  "submittedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AdditionalDocuments" (
  "id" TEXT PRIMARY KEY,
  "applicationId" TEXT NOT NULL,
  "submissionStatus" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  "achievements" TEXT,
  "degreeCertifications" TEXT,
  "fullProjectProposal" TEXT,
  "fundingPlan" TEXT,
  "identityDocument" TEXT,
  "languageProficiency" TEXT,
  "referenceOne" TEXT,
  "referenceTwo" TEXT,
  "riskMitigation" TEXT,
  "submittedAt" TIMESTAMP,
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
);

CREATE INDEX IF NOT EXISTS "Application_status_idx" ON "Application"("status");
CREATE INDEX IF NOT EXISTS "Application_createdAt_idx" ON "Application"("createdAt");
CREATE INDEX IF NOT EXISTS "AdditionalDocuments_applicationId_idx" ON "AdditionalDocuments"("applicationId");

-- Insert admin user
INSERT INTO "User" ("id", "email", "password", "name", "role", "createdAt", "updatedAt")
VALUES ('cltcky0y10000zri1ws8hxlju', 'techdev925@gmail.com', 'b0/AE9PVwrLyWplBQdBCOg3cFG/d.GRJci5jST.IYvNhiB3YiJQe', 'Admin User', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("email") DO NOTHING;
