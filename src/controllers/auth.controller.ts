import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  } as jwt.SignOptions);
}

export async function sendOtp(req: Request, res: Response) {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Telefone obrigatório' });

  const normalized = phone.replace(/\D/g, '');
  if (normalized.length < 10) return res.status(400).json({ error: 'Telefone inválido' });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  await prisma.otpCode.create({
    data: { phone: normalized, code, expiresAt },
  });

  // Em produção: enviar via SMS (Twilio, etc.)
  // Por ora retorna o código na resposta (desenvolvimento)
  const isDev = process.env.NODE_ENV !== 'production';
  console.log(`[OTP] ${normalized} → ${code}`);

  return res.json({
    message: 'Código enviado',
    ...(isDev && { devCode: code }),
  });
}

export async function verifyOtp(req: Request, res: Response) {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'Telefone e código obrigatórios' });

  const normalized = phone.replace(/\D/g, '');

  const otp = await prisma.otpCode.findFirst({
    where: {
      phone: normalized,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) return res.status(400).json({ error: 'Código inválido ou expirado' });

  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

  const user = await prisma.user.findUnique({ where: { phone: normalized } });
  if (!user) {
    return res.json({ verified: true, registered: false });
  }

  const token = generateToken(user.id);
  return res.json({
    verified: true,
    registered: true,
    token,
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role, groupId: user.groupId },
  });
}

export async function register(req: Request, res: Response) {
  const { phone, name } = req.body;
  if (!phone || !name) return res.status(400).json({ error: 'Nome e telefone obrigatórios' });

  const normalized = phone.replace(/\D/g, '');

  const existing = await prisma.user.findUnique({ where: { phone: normalized } });
  if (existing) return res.status(409).json({ error: 'Telefone já cadastrado' });

  const user = await prisma.user.create({
    data: { name: name.trim(), phone: normalized, role: 'MEMBER' },
  });

  const token = generateToken(user.id);
  return res.status(201).json({
    token,
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role, groupId: user.groupId },
  });
}
