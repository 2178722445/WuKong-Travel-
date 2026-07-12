import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { authRequired } from '../middleware/auth';

const router = Router();

router.get('/', authRequired, async (req: Request, res: Response) => {
  const favs = await prisma.favorite.findMany({
    where: { userId: req.user!.userId },
    include: { location: true },
    orderBy: { createdAt: 'desc' }
  });
  const parsed = favs.map(f => ({
    ...f,
    location: { ...f.location, tags: JSON.parse(f.location.tags), images: JSON.parse(f.location.images) }
  }));
  res.json(parsed);
});

router.post('/:locationId', authRequired, async (req: Request, res: Response) => {
  const locationId = parseInt(req.params.locationId);
  const existing = await prisma.favorite.findFirst({
    where: { userId: req.user!.userId, locationId }
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return res.json({ favorited: false });
  }
  await prisma.favorite.create({
    data: { userId: req.user!.userId, locationId }
  });
  res.json({ favorited: true });
});

export default router;