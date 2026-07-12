import { Router, Request, Response } from 'express';
import { prisma } from '../db';
import { adminRequired } from '../middleware/auth';

const router = Router();

router.get('/stats', adminRequired, async (_req: Request, res: Response) => {
  const [userCount, locationCount, reviewCount, itineraryCount] = await Promise.all([
    prisma.user.count(),
    prisma.location.count(),
    prisma.review.count(),
    prisma.itinerary.count(),
  ]);
  const topLocations = await prisma.location.findMany({
    orderBy: { viewCount: 'desc' },
    take: 10,
    select: { id: true, name: true, city: true, viewCount: true }
  });
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, username: true, createdAt: true }
  });
  res.json({ userCount, locationCount, reviewCount, itineraryCount, topLocations, recentUsers });
});

router.get('/locations', adminRequired, async (req: Request, res: Response) => {
  const { page = '1', pageSize = '20', search } = req.query;
  const skip = (parseInt(String(page)) - 1) * parseInt(String(pageSize));
  const take = parseInt(String(pageSize));
  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: String(search) } },
      { city: { contains: String(search) } },
    ];
  }
  const [locations, total] = await Promise.all([
    prisma.location.findMany({ where, skip, take, orderBy: { id: 'asc' } }),
    prisma.location.count({ where }),
  ]);
  const parsed = locations.map(l => ({ ...l, tags: JSON.parse(l.tags), images: JSON.parse(l.images) }));
  res.json({ locations: parsed, total, page: parseInt(String(page)), pageSize: take });
});

router.get('/users', adminRequired, async (req: Request, res: Response) => {
  const { page = '1', pageSize = '20' } = req.query;
  const skip = (parseInt(String(page)) - 1) * parseInt(String(pageSize));
  const take = parseInt(String(pageSize));
  const [users, total] = await Promise.all([
    prisma.user.findMany({ skip, take, orderBy: { createdAt: 'desc' }, select: { id: true, username: true, email: true, role: true, createdAt: true } }),
    prisma.user.count(),
  ]);
  res.json({ users, total, page: parseInt(String(page)), pageSize: take });
});

router.put('/users/:id/role', adminRequired, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: '无效角色' });
  const user = await prisma.user.update({ where: { id }, data: { role } });
  res.json({ id: user.id, username: user.username, role: user.role });
});

router.get('/reviews', adminRequired, async (req: Request, res: Response) => {
  const { page = '1', pageSize = '20' } = req.query;
  const skip = (parseInt(String(page)) - 1) * parseInt(String(pageSize));
  const take = parseInt(String(pageSize));
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      skip, take, orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, username: true } },
        location: { select: { id: true, name: true } }
      }
    }),
    prisma.review.count(),
  ]);
  res.json({ reviews, total, page: parseInt(String(page)), pageSize: take });
});

export default router;