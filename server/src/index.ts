import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import locationRoutes from './routes/locations';
import favoriteRoutes from './routes/favorites';
import reviewRoutes from './routes/reviews';
import itineraryRoutes from './routes/itineraries';
import dashboardRoutes from './routes/dashboard';
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/error';

const app = express();
const PORT = process.env.PORT || 3721;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.use('/api/*', notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Server] 黑神话山西取景地旅游规划 — API 服务已启动`);
  console.log(`[Server] 地址: http://localhost:${PORT}`);
  console.log(`[Server] 健康检查: http://localhost:${PORT}/api/health`);
});