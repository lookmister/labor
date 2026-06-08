import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res) => {
  const laborers = await prisma.laborer.findMany({ orderBy: { name: 'asc' } });
  res.json(laborers);
});

router.post('/', async (req, res) => {
  const { name, phone, email, rate, jobType } = req.body;
  const laborer = await prisma.laborer.create({ data: { name, phone, email, rate: Number(rate), jobType } });
  res.status(201).json(laborer);
});

router.put('/:id', async (req, res) => {
  const { name, phone, email, rate, jobType, active } = req.body;
  const laborer = await prisma.laborer.update({
    where: { id: Number(req.params.id) },
    data: { name, phone, email, rate: Number(rate), jobType, active },
  });
  res.json(laborer);
});

router.delete('/:id', async (req, res) => {
  await prisma.laborer.update({ where: { id: Number(req.params.id) }, data: { active: false } });
  res.json({ ok: true });
});

export default router;
