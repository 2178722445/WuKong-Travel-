import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authRequired } from '../middleware/auth';

const router = Router();

router.get('/', authRequired, async (req: Request, res: Response) => {
  const itineraries = await prisma.itinerary.findMany({
    where: { userId: req.user!.userId },
    include: { days: { orderBy: { dayNumber: 'asc' } } },
    orderBy: { updatedAt: 'desc' }
  });
  res.json(itineraries);
});

router.get('/:id', authRequired, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const itinerary = await prisma.itinerary.findFirst({
    where: { id, userId: req.user!.userId },
    include: { days: { orderBy: { dayNumber: 'asc' } } }
  });
  if (!itinerary) return res.status(404).json({ error: '行程不存在' });
  res.json(itinerary);
});

const daySchema = z.object({
  dayNumber: z.number(),
  locationIds: z.array(z.number()),
  note: z.string().default(''),
});

const createSchema = z.object({
  name: z.string().default('我的行程'),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  days: z.array(daySchema).default([]),
});

router.post('/', authRequired, async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body);
    const itinerary = await prisma.itinerary.create({
      data: {
        userId: req.user!.userId,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        days: {
          create: data.days.map(d => ({
            dayNumber: d.dayNumber,
            locationIds: JSON.stringify(d.locationIds),
            note: d.note
          }))
        }
      },
      include: { days: { orderBy: { dayNumber: 'asc' } } }
    });
    res.json(itinerary);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: '数据格式错误' });
    res.status(500).json({ error: '创建行程失败' });
  }
});

router.put('/:id', authRequired, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.itinerary.findFirst({ where: { id, userId: req.user!.userId } });
    if (!existing) return res.status(404).json({ error: '行程不存在' });

    const data = createSchema.partial().parse(req.body);
    await prisma.itineraryDay.deleteMany({ where: { itineraryId: id } });
    const itinerary = await prisma.itinerary.update({
      where: { id },
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        days: {
          create: (data.days || []).map(d => ({
            dayNumber: d.dayNumber,
            locationIds: JSON.stringify(d.locationIds),
            note: d.note
          }))
        }
      },
      include: { days: { orderBy: { dayNumber: 'asc' } } }
    });
    res.json(itinerary);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: '数据格式错误' });
    res.status(500).json({ error: '更新行程失败' });
  }
});

router.delete('/:id', authRequired, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.itinerary.findFirst({ where: { id, userId: req.user!.userId } });
  if (!existing) return res.status(404).json({ error: '行程不存在' });
  await prisma.itinerary.delete({ where: { id } });
  res.json({ success: true });
});

export default router;