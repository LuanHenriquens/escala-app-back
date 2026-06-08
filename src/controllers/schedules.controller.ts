import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const scheduleInclude = {
  members: {
    include: { user: { select: { id: true, name: true, phone: true } } },
    orderBy: { bandFunction: 'asc' as const },
  },
  songs: {
    include: { vocalist: { select: { id: true, name: true } } },
    orderBy: { order: 'asc' as const },
  },
  createdBy: { select: { id: true, name: true } },
};

export async function listSchedules(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user?.groupId) return res.status(400).json({ error: 'Você não pertence a um grupo' });

  const { mine, month, year } = req.query;

  const where: Record<string, unknown> = { groupId: user.groupId };

  if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    where.date = { gte: start, lt: end };
  }

  if (mine === 'true') {
    where.members = { some: { userId: user.id } };
  }

  const schedules = await prisma.schedule.findMany({
    where,
    include: scheduleInclude,
    orderBy: { date: 'asc' },
  });

  return res.json(schedules);
}

export async function getSchedule(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const schedule = await prisma.schedule.findUnique({
    where: { id: req.params.id },
    include: scheduleInclude,
  });

  if (!schedule) return res.status(404).json({ error: 'Escala não encontrada' });
  if (schedule.groupId !== user?.groupId) return res.status(403).json({ error: 'Acesso negado' });

  return res.json(schedule);
}

export async function createSchedule(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user?.groupId) return res.status(400).json({ error: 'Você não pertence a um grupo' });

  const { title, date } = req.body;
  if (!title || !date) return res.status(400).json({ error: 'Título e data obrigatórios' });

  const schedule = await prisma.schedule.create({
    data: {
      title: title.trim(),
      date: new Date(date),
      groupId: user.groupId,
      createdById: user.id,
    },
    include: scheduleInclude,
  });

  return res.status(201).json(schedule);
}

export async function updateSchedule(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const schedule = await prisma.schedule.findUnique({ where: { id: req.params.id } });

  if (!schedule) return res.status(404).json({ error: 'Escala não encontrada' });
  if (schedule.groupId !== user?.groupId) return res.status(403).json({ error: 'Acesso negado' });

  const { title, date } = req.body;

  const updated = await prisma.schedule.update({
    where: { id: req.params.id },
    data: {
      ...(title && { title: title.trim() }),
      ...(date && { date: new Date(date) }),
    },
    include: scheduleInclude,
  });

  return res.json(updated);
}

export async function deleteSchedule(req: AuthRequest, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const schedule = await prisma.schedule.findUnique({ where: { id: req.params.id } });

  if (!schedule) return res.status(404).json({ error: 'Escala não encontrada' });
  if (schedule.groupId !== user?.groupId) return res.status(403).json({ error: 'Acesso negado' });

  await prisma.schedule.delete({ where: { id: req.params.id } });
  return res.status(204).send();
}

// Members
export async function addMember(req: AuthRequest, res: Response) {
  const { userId, bandFunction } = req.body;
  if (!userId || !bandFunction) return res.status(400).json({ error: 'userId e função obrigatórios' });

  const validFunctions = ['GUITARIST', 'BASSIST', 'DRUMMER', 'KEYBOARDIST', 'VOCALIST', 'ACOUSTIC_GUITARIST'];
  if (!validFunctions.includes(bandFunction)) {
    return res.status(400).json({ error: 'Função inválida' });
  }

  const requester = await prisma.user.findUnique({ where: { id: req.userId } });
  const schedule = await prisma.schedule.findUnique({ where: { id: req.params.id } });

  if (!schedule || schedule.groupId !== requester?.groupId) {
    return res.status(404).json({ error: 'Escala não encontrada' });
  }

  const member = await prisma.scheduleMember.upsert({
    where: { scheduleId_userId: { scheduleId: req.params.id, userId } },
    update: { bandFunction },
    create: { scheduleId: req.params.id, userId, bandFunction },
    include: { user: { select: { id: true, name: true } } },
  });

  return res.status(201).json(member);
}

export async function removeMember(req: AuthRequest, res: Response) {
  const requester = await prisma.user.findUnique({ where: { id: req.userId } });
  const schedule = await prisma.schedule.findUnique({ where: { id: req.params.id } });

  if (!schedule || schedule.groupId !== requester?.groupId) {
    return res.status(404).json({ error: 'Escala não encontrada' });
  }

  await prisma.scheduleMember.deleteMany({
    where: { scheduleId: req.params.id, userId: req.params.userId },
  });

  return res.status(204).send();
}

// Songs
export async function addSong(req: AuthRequest, res: Response) {
  const { youtubeId, title, artist, thumbnailUrl, youtubeUrl, vocalistId, tone } = req.body;
  if (!title) return res.status(400).json({ error: 'Título da música obrigatório' });

  const requester = await prisma.user.findUnique({ where: { id: req.userId } });
  const schedule = await prisma.schedule.findUnique({ where: { id: req.params.id } });

  if (!schedule || schedule.groupId !== requester?.groupId) {
    return res.status(404).json({ error: 'Escala não encontrada' });
  }

  const count = await prisma.song.count({ where: { scheduleId: req.params.id } });

  const song = await prisma.song.create({
    data: {
      scheduleId: req.params.id,
      youtubeId: youtubeId ?? '',
      title,
      artist: artist ?? '',
      thumbnailUrl: thumbnailUrl ?? '',
      youtubeUrl: youtubeUrl ?? '',
      vocalistId: vocalistId ?? null,
      tone: tone ?? null,
      order: count,
    },
    include: { vocalist: { select: { id: true, name: true } } },
  });

  return res.status(201).json(song);
}

export async function updateSong(req: AuthRequest, res: Response) {
  const { vocalistId, tone, order } = req.body;

  const requester = await prisma.user.findUnique({ where: { id: req.userId } });
  const schedule = await prisma.schedule.findUnique({ where: { id: req.params.id } });

  if (!schedule || schedule.groupId !== requester?.groupId) {
    return res.status(404).json({ error: 'Escala não encontrada' });
  }

  const song = await prisma.song.update({
    where: { id: req.params.songId },
    data: {
      ...(vocalistId !== undefined && { vocalistId }),
      ...(tone !== undefined && { tone }),
      ...(order !== undefined && { order }),
    },
    include: { vocalist: { select: { id: true, name: true } } },
  });

  return res.json(song);
}

export async function removeSong(req: AuthRequest, res: Response) {
  const requester = await prisma.user.findUnique({ where: { id: req.userId } });
  const schedule = await prisma.schedule.findUnique({ where: { id: req.params.id } });

  if (!schedule || schedule.groupId !== requester?.groupId) {
    return res.status(404).json({ error: 'Escala não encontrada' });
  }

  await prisma.song.delete({ where: { id: req.params.songId } });
  return res.status(204).send();
}
