import { Router } from 'express';
import { sendOtp, verifyOtp, register } from '../controllers/auth.controller';

const router = Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);

export default router;
