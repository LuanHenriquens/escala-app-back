import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getMe,
  updateMe,
  addUnavailableDate,
  removeUnavailableDate,
  getUnavailableDates,
  getMySchedules,
} from '../controllers/users.controller';

const router = Router();

router.use(authenticate);

router.get('/me', getMe);
router.patch('/me', updateMe);
router.get('/me/schedules', getMySchedules);
router.get('/me/unavailable-dates', getUnavailableDates);
router.post('/me/unavailable-dates', addUnavailableDate);
router.delete('/me/unavailable-dates/:date', removeUnavailableDate);

export default router;
