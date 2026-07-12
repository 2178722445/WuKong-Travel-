import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authOptional, adminRequired } from '../middleware/auth';

const router = Router();

router.get('/', authOptional, async (req: Request, res: Response) => {
  const { city, tag, search } = req.query;
  const where: any = {};
  if (city) where.city = { contains: String(city) };
  if (tag) where.tags = { contains: String(tag) };
  if (search) {
    where.OR = [
      { name: { contains: String(search) } },
      { description: { contains: String(search) } },
      { city: { contains: String(search) } },
    ];
  }
  const locations = await prisma.location.findMany({ where, orderBy: { id: 'asc' } });
  const parsed = locations.map(l => ({ ...l, tags: JSON.parse(l.tags), images: JSON.parse(l.images) }));
  let favorites: number[] = [];
  if (req.user) {
    const favs = await prisma.favorite.findMany({ where: { userId: req.user.userId }, select: { locationId: true } });
    favorites = favs.map(f => f.locationId);
  }
  res.json({ locations: parsed, favorites });
});

router.get('/:id', authOptional, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const location = await prisma.location.findUnique({ where: { id } });
  if (!location) return res.status(404).json({ error: '取景地不存在' });
  await prisma.location.update({ where: { id }, data: { viewCount: { increment: 1 } } });
  const isFavorited = req.user ? !!(await prisma.favorite.findFirst({ where: { userId: req.user.userId, locationId: id } })) : false;
  const reviews = await prisma.review.findMany({
    where: { locationId: id },
    include: { user: { select: { id: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({
    ...location,
    tags: JSON.parse(location.tags),
    images: JSON.parse(location.images),
    isFavorited,
    reviews
  });
});

const locationSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  district: z.string().min(1),
  lng: z.number(),
  lat: z.number(),
  tags: z.array(z.string()).default([]),
  period: z.string().default(''),
  description: z.string().default(''),
  ticket: z.string().default(''),
  hours: z.string().default(''),
  bestSeason: z.string().default(''),
  highlight: z.string().default(''),
  images: z.array(z.string()).default([]),
});

router.post('/', adminRequired, async (req: Request, res: Response) => {
  try {
    const data = locationSchema.parse(req.body);
    const location = await prisma.location.create({
      data: { ...data, tags: JSON.stringify(data.tags), images: JSON.stringify(data.images) }
    });
    res.json(location);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: '输入数据格式错误', details: e.errors });
    res.status(500).json({ error: '创建失败' });
  }
});

router.put('/:id', adminRequired, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const data = locationSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.tags) updateData.tags = JSON.stringify(data.tags);
    if (data.images) updateData.images = JSON.stringify(data.images);
    const location = await prisma.location.update({ where: { id }, data: updateData });
    res.json(location);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: '输入数据格式错误' });
    res.status(500).json({ error: '更新失败' });
  }
});

router.delete('/:id', adminRequired, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await prisma.location.delete({ where: { id } });
  res.json({ success: true });
});

export default router;