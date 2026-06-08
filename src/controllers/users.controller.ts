import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

export async function getMe(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, phone: true, role: true, groupId: true, group: { select: { id: true, name: true, code: true } } },
  });
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  return res.json(user);
}

export async function updateMe(req: AuthRequest, res: Response) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome obrigatório' });

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { name: name.trim() },
    select: { id: true, name: true, phone: true, role: true, groupId: true },
  });
  return res.json(user);
}

export async function addUnavailableDate(req: AuthRequest, res: Response) {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'Data obrigatória' });

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return res.status(400).json({ error: 'Data inválida' });

  const unavailable = await prisma.unavailableDate.upsert({
    where: { userId_date: { userId: req.userId!, date: parsed } },
    update: {},
    create: { userId: req.userId!, date: parsed },
  });
  return res.status(201).json(unavailable);
}

export async function removeUnavailableDate(req: AuthRequest, res: Response) {
  const { date } = req.params;
  const parsed = new Date(date);

  await prisma.unavailableDate.deleteMany({
    where: { userId: req.userId, date: parsed },
  });
  return res.status(204).send();
}

export async function getUnavailableDates(req: AuthRequest, res: Response) {
  const dates = await prisma.unavailableDate.findMany({
    where: { userId: req.userId },
    orderBy: { date: 'asc' },
  });
  return res.json(dates);
}

export async function getMySchedules(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user?.groupId) return res.json([]);

  const schedules = await prisma.schedule.findMany({
    where: { groupId: user.groupId, members: { some: { userId: user.id } } },
    include: {
      members: { include: { user: { select: { id: true, name: true } } } },
      songs: { include: { vocalist: { select: { id: true, name: true } } }, orderBy: { order: 'asc' } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { date: 'asc' },
  });
  return res.json(schedules);
}
