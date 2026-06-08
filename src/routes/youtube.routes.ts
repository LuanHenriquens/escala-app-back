import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { searchYoutube } from '../controllers/youtube.controller';

const router = Router();

router.use(authenticate);
router.get('/search', searchYoutube);

export default router;
