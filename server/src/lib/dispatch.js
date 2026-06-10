import { prisma } from './prisma.js';
import { buildJobMessage, sendSms } from './sms.js';

/**
 * Sends the job offer to the next un-contacted laborer for this event.
 * Called on event creation and after a rejection.
 */
export async function dispatchNext(eventId) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      assignments: { select: { laborerId: true } },
    },
  });

  if (!event) return;

  const contactedIds = event.assignments.map((a) => a.laborerId);
  const acceptedCount = await prisma.assignment.count({
    where: { eventId, status: 'accepted' },
  });

  if (acceptedCount >= event.laborCount) {
    await prisma.event.update({ where: { id: eventId }, data: { status: 'staffed' } });
    return;
  }

  const laborer = await prisma.laborer.findFirst({
    where: {
      jobType: event.laborType,
      active: true,
      id: { notIn: contactedIds },
      ...(event.region ? { region: event.region } : {}),
    },
    orderBy: { priority: 'asc' }, // A before B before C, etc.
  });

  if (!laborer) {
    console.log(`No more available laborers for event ${eventId}`);
    return;
  }

  const assignment = await prisma.assignment.create({
    data: { eventId, laborerId: laborer.id, status: 'pending' },
  });

  const message = buildJobMessage(laborer, event);
  await sendSms(laborer.phone, message);

  await prisma.event.update({ where: { id: eventId }, data: { status: 'dispatching' } });

  return assignment;
}
