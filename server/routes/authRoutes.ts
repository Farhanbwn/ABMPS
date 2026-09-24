import { Router } from 'express';
import { loginAdmin, logoutAdmin, getCurrentAdmin, changePassword } from '../controllers/authController';
import { authenticateAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { loginSchema, changePasswordSchema } from '../validators/authValidators';

const router = Router();

router.post('/login', validateRequest({ body: loginSchema }), loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/me', authenticateAdmin, getCurrentAdmin);
router.post(
  '/change-password',
  authenticateAdmin,
  validateRequest({ body: changePasswordSchema }),
  changePassword
);

export default router;
