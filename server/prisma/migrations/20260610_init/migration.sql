CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "exhibitor" TEXT,
    "booth" TEXT,
    "region" TEXT NOT NULL DEFAULT 'San Diego',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approval" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LaborRequirement" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "laborType" TEXT NOT NULL,
    "laborCount" INTEGER NOT NULL,
    "installDates" TEXT NOT NULL DEFAULT '[]',
    "dismantleDates" TEXT NOT NULL DEFAULT '[]',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "LaborRequirement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Laborer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "rate" DOUBLE PRECISION NOT NULL,
    "jobType" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'D',
    "region" TEXT NOT NULL DEFAULT 'San Diego',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Laborer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "laborerId" INTEGER NOT NULL,
    "requirementId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "repliedAt" TIMESTAMP(3),
    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Laborer_phone_key" ON "Laborer"("phone");

ALTER TABLE "LaborRequirement" ADD CONSTRAINT "LaborRequirement_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_laborerId_fkey" FOREIGN KEY ("laborerId") REFERENCES "Laborer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "LaborRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
