-- CreateTable
CREATE TABLE "client_requests" (
    "id" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_requests_email_redirectUri_key" ON "client_requests"("email", "redirectUri");
