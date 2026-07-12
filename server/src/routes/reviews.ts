import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { authRequired } from '../middleware/auth';

const router = Router();

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().max(2000).default(''),
  images: z.array(z.string()).default([]),
});

router.get('/location/:locationId', async (req: Request, res: Response) => {
  const locationId = parseInt(req.params.locationId);
  const reviews = await prisma.review.findMany({
    where: { locationId },
    include: { user: { select: { id: true, username: true, avatar: true } } },
    orderBy: { createdAt: 'desc' }
  });
  const parsed = reviews.map(r => ({ ...r, images: JSON.parse(r.images) }));
  res.json(parsed);
});

router.post('/:locationId', authRequired, async (req: Request, res: Response) => {
  try {
    const locationId = parseInt(req.params.locationId);
    const data = reviewSchema.parse(req.body);
    const existing = await prisma.review.findFirst({
      where: { userId: req.user!.userId, locationId }
    });
    if (existing) {
      const review = await prisma.review.update({
        where: { id: existing.id },
        data: { rating: data.rating, content: data.content, images: JSON.stringify(data.images) }
      });
      return res.json(review);
    }
    const review = await prisma.review.create({
      data: {
        userId: req.user!.userId,
        locationId,
        rating: data.rating,
        content: data.content,
        images: JSON.stringify(data.images)
      }
    });
    res.json(review);
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: '数据格式错误' });
    res.status(500).json({ error: '提交评价失败' });
  }
});

router.delete('/:id', authRequired, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return res.status(404).json({ error: '评价不存在' });
  if (review.userId !== req.user!.userId && req.user!.role !== 'admin') {
    return res.status(403).json({ error: '无权限' });
  }
  await prisma.review.delete({ where: { id } });
  res.json({ success: true });
});

export default router;