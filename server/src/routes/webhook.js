import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { dispatchNext } from '../lib/dispatch.js';
import { sendSms } from '../lib/sms.js';

const router = Router();

// Vonage sends GET or POST to /webhook/sms when laborer replies
router.get('/sms', handleInbound);
router.post('/sms', handleInbound);

async function handleInbound(req, res) {
  const params = { ...req.query, ...req.body };
  console.log('[webhook] inbound:', JSON.stringify(params));
  const rawFrom = params.msisdn || params.from || null;
  const from = rawFrom ? (rawFrom.startsWith('+') ? rawFrom : `+${rawFrom}`) : null;
  const body = (params.text || '').trim().toUpperCase();

  if (!from) return res.status(200).end();

  const laborer = await prisma.laborer.findFirst({ where: { phone: from } });
  if (!laborer) return res.status(200).end();

  const assignment = await prisma.assignment.findFirst({
    where: { laborerId: laborer.id, status: 'pending' },
    orderBy: { sentAt: 'desc' },
  });

  if (!assignment) return res.status(200).end();

  if (body === 'YES') {
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: 'accepted', repliedAt: new Date() },
    });
    const event = await prisma.event.findUnique({ where: { id: assignment.eventId } });
    const acceptedCount = await prisma.assignment.count({
      where: { eventId: assignment.eventId, status: 'accepted' },
    });
    if (acceptedCount >= event.laborCount) {
      await prisma.event.update({ where: { id: assignment.eventId }, data: { status: 'staffed' } });
    }
    await sendSms(from, 'Thank you for accepting the assignment. We\'ll see you soon!');
  } else if (body === 'NO') {
    await prisma.assignment.update({
      where: { id: assignment.id },
      data: { status: 'rejected', repliedAt: new Date() },
    });
    await dispatchNext(assignment.eventId);
    await sendSms(from, 'Thanks for letting us know. We\'ll reach out for future opportunities.');
  }

  res.status(200).end();
}

export default router;
