import { Router } from 'express';
import { loginAdmin, logoutAdmin, getCurrentAdmin, changePassword } from '../controllers/authController';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/me', authenticateAdmin, getCurrentAdmin);
router.post('/change-password', authenticateAdmin, changePassword);

export default router;
