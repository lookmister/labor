import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { dispatchNext } from '../lib/dispatch.js';

const router = Router();

// Twilio sends POST to /webhook/sms when laborer replies
router.post('/sms', async (req, res) => {
  const from = req.body.From; // laborer's phone number
  const body = (req.body.Body || '').trim().toUpperCase();

  const laborer = await prisma.laborer.findFirst({ where: { phone: from } });
  if (!laborer) {
    return res.status(200).send('<Response/>');
  }

  // Find the most recent pending assignment for this laborer
  const assignment = await prisma.assignment.findFirst({
    where: { laborerId: laborer.id, status: 'pending' },
    orderBy: { sentAt: 'desc' },
  });

  if (!assignment) {
    return res.status(200).send('<Response/>');
  }

  if (body === 'YES') {
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: 'accepted', repliedAt: new Date() },
    });
    // Check if event is fully staffed
    const event = await prisma.event.findUnique({ where: { id: assignment.eventId } });
    const acceptedCount = await prisma.assignment.count({
      where: { eventId: assignment.eventId, status: 'accepted' },
    });
    if (acceptedCount >= event.laborCount) {
      await prisma.event.update({ where: { id: assignment.eventId }, data: { status: 'staffed' } });
    }
  } else if (body === 'NO') {
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: 'rejected', repliedAt: new Date() },
    });
    // Dispatch to next available laborer
    await dispatchNext(assignment.eventId);
  }

  res.status(200).send('<Response/>');
});

export default router;
