import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/role';
import { createGroup, joinGroup, getGroup, getGroupMembers, promoteToAdmin, getUnavailableUsersOnDate } from '../controllers/groups.controller';

const router = Router();

router.use(authenticate);

router.post('/', createGroup);
router.post('/join', joinGroup);
router.get('/me', getGroup);
router.get('/me/members', getGroupMembers);
router.patch('/me/members/:userId/promote', requireAdmin, promoteToAdmin);
router.get('/me/unavailable-on', getUnavailableUsersOnDate);

export default router;
