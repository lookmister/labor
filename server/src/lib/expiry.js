import { prisma } from './prisma.js';
import { dispatchNext } from './dispatch.js';
import { sendSms } from './sms.js';

const EXPIRY_HOURS = 12;

export async function expireStaleOffers() {
  const cutoff = new Date(Date.now() - EXPIRY_HOURS * 60 * 60 * 1000);

  const stale = await prisma.assignment.findMany({
    where: {
      status: 'pending',
      sentAt: { lt: cutoff },
    },
    include: { laborer: true },
  });

  for (const assignment of stale) {
    console.log(`[expiry] Expiring offer for ${assignment.laborer.name} on event ${assignment.eventId}`);

    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: 'expired', repliedAt: new Date() },
    });

    // Notify the laborer their window closed
    await sendSms(
      assignment.laborer.phone,
      `Hi ${assignment.laborer.name.split(' ')[0]}, your 12-hour window to accept the job offer has expired. We'll reach out for future opportunities.`
    ).catch(() => {}); // don't crash if SMS fails

    // Dispatch to next available laborer
    await dispatchNext(assignment.eventId, assignment.requirementId);
  }

  if (stale.length > 0) {
    console.log(`[expiry] Expired ${stale.length} offer(s)`);
  }
}

// Run every 15 minutes
export function startExpiryWorker() {
  console.log('[expiry] Worker started — checking every 15 minutes');
  setInterval(expireStaleOffers, 15 * 60 * 1000);
  // Also run immediately on startup to catch any already-expired offers
  expireStaleOffers();
}
