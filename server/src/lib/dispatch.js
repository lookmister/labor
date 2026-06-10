import { prisma } from './prisma.js';
import { buildJobMessage, sendSms } from './sms.js';

/**
 * Sends offers to fill all open slots simultaneously.
 * Called on dispatch button click.
 */
export async function dispatchAll(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { assignments: true },
  });

  if (!event) return;

  // Count how many slots are already filled or pending
  const filledOrPending = event.assignments.filter(
    (a) => a.status === 'accepted' || a.status === 'pending'
  ).length;

  const slotsToFill = event.laborCount - filledOrPending;

  if (slotsToFill <= 0) {
    await prisma.event.update({ where: { id: eventId }, data: { status: 'staffed' } });
    return;
  }

  const contactedIds = event.assignments.map((a) => a.laborerId);

  // Find enough laborers to fill all open slots at once
  const laborers = await prisma.laborer.findMany({
    where: {
      jobType: event.laborType,
      active: true,
      id: { notIn: contactedIds },
      ...(event.region ? { region: event.region } : {}),
    },
    orderBy: { priority: 'asc' },
    take: slotsToFill,
  });

  if (laborers.length === 0) {
    console.log(`No available laborers for event ${eventId}`);
    return;
  }

  // Send all offers simultaneously
  await Promise.all(laborers.map(async (laborer) => {
    await prisma.assignment.create({
      data: { eventId, laborerId: laborer.id, status: 'pending' },
    });
    const message = buildJobMessage(laborer, event);
    await sendSms(laborer.phone, message);
    console.log(`[dispatch] Sent offer to ${laborer.name} for event ${eventId}`);
  }));

  await prisma.event.update({ where: { id: eventId }, data: { status: 'dispatching' } });
}

/**
 * Called after a rejection or expiry — fills just that one open slot.
 */
export async function dispatchNext(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { assignments: true },
  });

  if (!event) return;

  const acceptedCount = event.assignments.filter((a) => a.status === 'accepted').length;
  if (acceptedCount >= event.laborCount) {
    await prisma.event.update({ where: { id: eventId }, data: { status: 'staffed' } });
    return;
  }

  const contactedIds = event.assignments.map((a) => a.laborerId);

  const laborer = await prisma.laborer.findFirst({
    where: {
      jobType: event.laborType,
      active: true,
      id: { notIn: contactedIds },
      ...(event.region ? { region: event.region } : {}),
    },
    orderBy: { priority: 'asc' },
  });

  if (!laborer) {
    console.log(`No more available laborers for event ${eventId}`);
    return;
  }

  await prisma.assignment.create({
    data: { eventId, laborerId: laborer.id, status: 'pending' },
  });

  const message = buildJobMessage(laborer, event);
  await sendSms(laborer.phone, message);
  console.log(`[dispatch] Sent replacement offer to ${laborer.name} for event ${eventId}`);

  await prisma.event.update({ where: { id: eventId }, data: { status: 'dispatching' } });
}
