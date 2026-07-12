import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../db';
import { generateToken, authRequired } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  username: z.string().min(2).max(20),
  email: z.string().email(),
  password: z.string().min(6).max(50),
});

router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.email }] }
    });
    if (exists) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }
    const password = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { username: data.username, email: data.email, password }
    });
    const token = generateToken({ userId: user.id, role: user.role });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, role: user.role } });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: '输入数据格式错误', details: e.errors });
    res.status(500).json({ error: '注册失败' });
  }
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.username }] }
    });
    if (!user) return res.status(400).json({ error: '用户不存在' });
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) return res.status(400).json({ error: '密码错误' });
    const token = generateToken({ userId: user.id, role: user.role });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar, role: user.role } });
  } catch (e: any) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: '输入数据格式错误' });
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/me', authRequired, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, username: true, email: true, avatar: true, role: true, createdAt: true }
  });
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json(user);
});

router.put('/profile', authRequired, async (req: Request, res: Response) => {
  const { avatar } = req.body;
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { avatar },
    select: { id: true, username: true, email: true, avatar: true, role: true }
  });
  res.json(user);
});

export default router;