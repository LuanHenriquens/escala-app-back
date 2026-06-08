import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import groupRoutes from './routes/groups.routes';
import scheduleRoutes from './routes/schedules.routes';
import userRoutes from './routes/users.routes';
import youtubeRoutes from './routes/youtube.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/users', userRoutes);
app.use('/youtube', youtubeRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`🎵 Escala Louvor API rodando na porta ${PORT}`);
});

export default app;
