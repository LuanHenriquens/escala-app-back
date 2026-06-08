import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';
import {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  addMember,
  removeMember,
  addSong,
  updateSong,
  removeSong,
} from '../controllers/schedules.controller';

const router = Router();

router.use(authenticate);

router.get('/', listSchedules);
router.get('/:id', getSchedule);
router.post('/', requireAdmin, createSchedule);
router.put('/:id', requireAdmin, updateSchedule);
router.delete('/:id', requireAdmin, deleteSchedule);

router.post('/:id/members', requireAdmin, addMember);
router.delete('/:id/members/:userId', requireAdmin, removeMember);

router.post('/:id/songs', requireAdmin, addSong);
router.patch('/:id/songs/:songId', requireAdmin, updateSong);
router.delete('/:id/songs/:songId', requireAdmin, removeSong);

export default router;
