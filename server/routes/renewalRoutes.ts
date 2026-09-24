import { Router } from 'express';
import {
  createRenewal,
  getAllRenewals,
  getRenewalsByMember,
  getRenewalsByYear,
  updateRenewal,
  deleteRenewal,
} from '../controllers/renewalController';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// Protect all renewal routes
router.use(authenticateAdmin);

router.post('/', createRenewal);
router.get('/', getAllRenewals);
router.get('/member/:memberId', getRenewalsByMember);
router.get('/year/:year', getRenewalsByYear);
router.put('/:id', updateRenewal);
router.delete('/:id', deleteRenewal);

export default router;
