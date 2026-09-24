import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateAdmin);

router.get('/stats', getDashboardStats);

export default router;
