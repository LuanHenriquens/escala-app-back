# Escala Louvor — API

REST API para o app de escalas de ministério de louvor.

## Stack
- Node.js + TypeScript + Express
- Prisma ORM + SQLite (dev) / PostgreSQL (prod)
- JWT para autenticação

## Setup

```bash
cp .env.example .env
# edite .env com seus valores

npm install
npx prisma migrate dev
npm run dev
```

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | URL do banco (SQLite: `file:./dev.db`) |
| `JWT_SECRET` | Chave secreta JWT |
| `YOUTUBE_API_KEY` | Chave da YouTube Data API v3 |
| `PORT` | Porta (padrão: 3000) |
| `NODE_ENV` | `development` ou `production` |

## Endpoints

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/send-otp` | Envia OTP para o celular |
| POST | `/auth/verify-otp` | Verifica OTP e retorna token |
| POST | `/auth/register` | Cadastra novo usuário |

### Grupos
| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| POST | `/groups` | Auth | Cria grupo (vira admin) |
| POST | `/groups/join` | Auth | Entra em grupo pelo código |
| GET | `/groups/me` | Auth | Dados do grupo |
| GET | `/groups/me/members` | Auth | Lista membros |
| PATCH | `/groups/me/members/:id/promote` | Admin | Promove a admin |

### Escalas
| Método | Rota | Permissão | Descrição |
|--------|------|-----------|-----------|
| GET | `/schedules` | Auth | Lista escalas do grupo |
| GET | `/schedules/:id` | Auth | Detalhes da escala |
| POST | `/schedules` | Admin | Cria escala |
| PUT | `/schedules/:id` | Admin | Edita escala |
| DELETE | `/schedules/:id` | Admin | Remove escala |
| POST | `/schedules/:id/members` | Admin | Adiciona músico |
| DELETE | `/schedules/:id/members/:userId` | Admin | Remove músico |
| POST | `/schedules/:id/songs` | Admin | Adiciona música |
| PATCH | `/schedules/:id/songs/:songId` | Admin | Edita música |
| DELETE | `/schedules/:id/songs/:songId` | Admin | Remove música |

### Usuários
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/users/me` | Perfil atual |
| PATCH | `/users/me` | Atualiza nome |
| GET | `/users/me/schedules` | Minhas escalas |
| GET | `/users/me/unavailable-dates` | Datas indisponíveis |
| POST | `/users/me/unavailable-dates` | Marca indisponível |
| DELETE | `/users/me/unavailable-dates/:date` | Remove indisponibilidade |

### YouTube
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/youtube/search?q=` | Busca vídeos |

## Notas

- Em `NODE_ENV=development` o OTP retorna `devCode` no response (sem SMS real)
- Para produção integrar Twilio ou similar no `auth.controller.ts`
- YouTube API Key obter em https://console.cloud.google.com (habilitar YouTube Data API v3)
