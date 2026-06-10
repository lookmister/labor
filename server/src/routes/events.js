import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { dispatchAll } from '../lib/dispatch.js';

const router = Router();

const include = {
  requirements: true,
  assignments: { include: { laborer: true, requirement: true } },
};

router.get('/', async (req, res) => {
  const events = await prisma.event.findMany({ orderBy: { createdAt: 'desc' }, include });
  res.json(events);
});

router.get('/:id', async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: Number(req.params.id) }, include });
  if (!event) return res.status(404).json({ error: 'Not found' });
  res.json(event);
});

router.post('/', async (req, res) => {
  const { name, venue, exhibitor, booth, region, requirements } = req.body;

  const event = await prisma.event.create({
    data: {
      name, venue, exhibitor, booth,
      region: region || 'San Diego',
      requirements: {
        create: requirements.map((r) => ({
          laborType: r.laborType,
          laborCount: Number(r.laborCount),
          installDates: JSON.stringify(r.installDates || []),
          dismantleDates: JSON.stringify(r.dismantleDates || []),
        })),
      },
    },
    include,
  });

  res.status(201).json(event);
});

router.post('/:id/dispatch', async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: Number(req.params.id) } });
  if (!event) return res.status(404).json({ error: 'Not found' });
  if (event.approval !== 'approved') return res.status(403).json({ error: 'Event must be approved before dispatching.' });

  await dispatchAll(event.id);

  const updated = await prisma.event.findUnique({ where: { id: event.id }, include });
  res.json(updated);
});

router.post('/:id/approve', async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: Number(req.params.id) } });
  if (!event) return res.status(404).json({ error: 'Not found' });
  const approval = event.approval === 'approved' ? 'pending' : 'approved';
  const updated = await prisma.event.update({ where: { id: Number(req.params.id) }, data: { approval }, include });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await prisma.assignment.deleteMany({ where: { eventId: Number(req.params.id) } });
  await prisma.laborRequirement.deleteMany({ where: { eventId: Number(req.params.id) } });
  await prisma.event.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

export default router;
