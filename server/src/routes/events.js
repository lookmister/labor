import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { dispatchNext } from '../lib/dispatch.js';

const router = Router();

router.get('/', async (req, res) => {
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: { assignments: { include: { laborer: true } } },
  });
  res.json(events);
});

router.get('/:id', async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: Number(req.params.id) },
    include: { assignments: { include: { laborer: true } } },
  });
  if (!event) return res.status(404).json({ error: 'Not found' });
  res.json(event);
});

router.post('/', async (req, res) => {
  const { name, venue, exhibitor, booth, installDates, dismantleDates, laborType, laborCount, dispatch } = req.body;

  const event = await prisma.event.create({
    data: {
      name,
      venue,
      exhibitor,
      booth,
      installDates: JSON.stringify(installDates),
      dismantleDates: JSON.stringify(dismantleDates),
      laborType,
      laborCount: Number(laborCount),
    },
  });

  // Only dispatch if explicitly requested
  if (dispatch) {
    for (let i = 0; i < event.laborCount; i++) {
      await dispatchNext(event.id);
    }
  }

  const updated = await prisma.event.findUnique({
    where: { id: event.id },
    include: { assignments: { include: { laborer: true } } },
  });

  res.status(201).json(updated);
});

// Dispatch an existing draft event
router.post('/:id/dispatch', async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: Number(req.params.id) } });
  if (!event) return res.status(404).json({ error: 'Not found' });

  const acceptedCount = await prisma.assignment.count({
    where: { eventId: event.id, status: 'accepted' },
  });
  const remaining = event.laborCount - acceptedCount;

  for (let i = 0; i < remaining; i++) {
    await dispatchNext(event.id);
  }

  const updated = await prisma.event.findUnique({
    where: { id: event.id },
    include: { assignments: { include: { laborer: true } } },
  });

  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await prisma.assignment.deleteMany({ where: { eventId: Number(req.params.id) } });
  await prisma.event.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

export default router;
