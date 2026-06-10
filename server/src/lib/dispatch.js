import { prisma } from './prisma.js';
import { buildJobMessage, sendSms } from './sms.js';

/**
 * Dispatch all open slots across all requirements simultaneously.
 */
export async function dispatchAll(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { requirements: true, assignments: true },
  });
  if (!event) return;

  await Promise.all(event.requirements.map((req) => dispatchRequirement(event, req)));
  await prisma.event.update({ where: { id: eventId }, data: { status: 'dispatching' } });
}

/**
 * Fill open slots for a single requirement.
 */
export async function dispatchRequirement(event, requirement) {
  const existingForReq = await prisma.assignment.findMany({
    where: { requirementId: requirement.id },
  });

  const filledOrPending = existingForReq.filter(
    (a) => a.status === 'accepted' || a.status === 'pending'
  ).length;

  const slotsToFill = requirement.laborCount - filledOrPending;
  if (slotsToFill <= 0) return;

  const contactedIds = existingForReq.map((a) => a.laborerId);

  const laborers = await prisma.laborer.findMany({
    where: {
      jobType: requirement.laborType,
      active: true,
      id: { notIn: contactedIds },
      ...(event.region ? { region: event.region } : {}),
    },
    orderBy: { priority: 'asc' },
    take: slotsToFill,
  });

  if (laborers.length < slotsToFill) {
    // Couldn't find enough laborers — flag the requirement
    await prisma.laborRequirement.update({
      where: { id: requirement.id },
      data: { flagged: true },
    });
    console.log(`[dispatch] ⚠️ Not enough ${requirement.laborType} laborers for requirement ${requirement.id} (need ${slotsToFill}, found ${laborers.length})`);
  } else {
    // Clear any previous flag
    await prisma.laborRequirement.update({
      where: { id: requirement.id },
      data: { flagged: false },
    });
  }

  await Promise.all(laborers.map(async (laborer) => {
    await prisma.assignment.create({
      data: { eventId: event.id, laborerId: laborer.id, requirementId: requirement.id, status: 'pending' },
    });
    const message = buildJobMessage(laborer, event, requirement);
    await sendSms(laborer.phone, message);
    console.log(`[dispatch] Sent ${requirement.laborType} offer to ${laborer.name}`);
  }));
}

/**
 * Called after a rejection/expiry — fills just that one slot for the same requirement.
 */
export async function dispatchNext(eventId, requirementId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { requirements: true },
  });
  if (!event) return;

  const requirement = event.requirements.find((r) => r.id === requirementId);
  if (!requirement) return;

  const existingForReq = await prisma.assignment.findMany({
    where: { requirementId },
  });

  const acceptedCount = existingForReq.filter((a) => a.status === 'accepted').length;
  if (acceptedCount >= requirement.laborCount) {
    // Check if all requirements are fully staffed
    const allStaffed = await checkAllStaffed(eventId);
    if (allStaffed) {
      await prisma.event.update({ where: { id: eventId }, data: { status: 'staffed' } });
    }
    return;
  }

  const contactedIds = existingForReq.map((a) => a.laborerId);

  const laborer = await prisma.laborer.findFirst({
    where: {
      jobType: requirement.laborType,
      active: true,
      id: { notIn: contactedIds },
      ...(event.region ? { region: event.region } : {}),
    },
    orderBy: { priority: 'asc' },
  });

  if (!laborer) {
    console.log(`[dispatch] ⚠️ No more laborers available for requirement ${requirementId}`);
    await prisma.laborRequirement.update({
      where: { id: requirementId },
      data: { flagged: true },
    });
    return;
  }

  // Clear flag since we found someone
  await prisma.laborRequirement.update({
    where: { id: requirementId },
    data: { flagged: false },
  });

  await prisma.assignment.create({
    data: { eventId, laborerId: laborer.id, requirementId, status: 'pending' },
  });

  const message = buildJobMessage(laborer, event, requirement);
  await sendSms(laborer.phone, message);
}

async function checkAllStaffed(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { requirements: true },
  });
  for (const req of event.requirements) {
    const count = await prisma.assignment.count({
      where: { requirementId: req.id, status: 'accepted' },
    });
    if (count < req.laborCount) return false;
  }
  return true;
}
