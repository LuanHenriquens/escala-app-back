import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createGroup(req: AuthRequest, res: Response) {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome do grupo obrigatório' });

  let code = generateCode();
  while (await prisma.group.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const group = await prisma.group.create({ data: { name: name.trim(), code } });

  await prisma.user.update({
    where: { id: req.userId },
    data: { groupId: group.id, role: 'ADMIN' },
  });

  return res.status(201).json(group);
}

export async function joinGroup(req: AuthRequest, res: Response) {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Código do grupo obrigatório' });

  const group = await prisma.group.findUnique({ where: { code: code.toUpperCase() } });
  if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user?.groupId) return res.status(409).json({ error: 'Você já pertence a um grupo' });

  await prisma.user.update({
    where: { id: req.userId },
    data: { groupId: group.id },
  });

  return res.json(group);
}

export async function getGroup(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { group: { include: { members: { select: { id: true, name: true, phone: true, role: true } } } } },
  });

  if (!user?.group) return res.status(404).json({ error: 'Grupo não encontrado' });
  return res.json(user.group);
}

export async function getGroupMembers(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user?.groupId) return res.status(404).json({ error: 'Você não pertence a um grupo' });

  const members = await prisma.user.findMany({
    where: { groupId: user.groupId },
    select: { id: true, name: true, phone: true, role: true },
    orderBy: { name: 'asc' },
  });

  return res.json(members);
}

export async function getUnavailableUsersOnDate(req: AuthRequest, res: Response) {
  const { date } = req.query;
  if (!date || typeof date !== 'string') return res.status(400).json({ error: 'date obrigatório' });

  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user?.groupId) return res.status(400).json({ error: 'Você não pertence a um grupo' });

  const day = new Date(date);
  const start = new Date(day); start.setHours(0, 0, 0, 0);
  const end = new Date(day); end.setHours(23, 59, 59, 999);

  const records = await prisma.unavailableDate.findMany({
    where: { user: { groupId: user.groupId }, date: { gte: start, lte: end } },
    select: { userId: true },
  });

  return res.json(records.map((r) => r.userId));
}

export async function promoteToAdmin(req: AuthRequest, res: Response) {
  const { userId } = req.params;
  const requester = await prisma.user.findUnique({ where: { id: req.userId } });

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target || target.groupId !== requester?.groupId) {
    return res.status(404).json({ error: 'Usuário não encontrado no grupo' });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: 'ADMIN' },
    select: { id: true, name: true, role: true },
  });

  return res.json(updated);
}
