import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wukong-travel-secret-key-2026';

export interface AuthPayload {
  userId: number;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET) as AuthPayload;
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
}

export function authOptional(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), JWT_SECRET) as AuthPayload;
    } catch { /* ignore */ }
  }
  next();
}

export function adminRequired(req: Request, res: Response, next: NextFunction) {
  authRequired(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    next();
  });
}
