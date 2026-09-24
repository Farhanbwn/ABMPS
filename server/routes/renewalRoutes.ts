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
import { validateRequest } from '../middleware/validate';
import {
  createRenewalSchema,
  updateRenewalSchema,
  renewalIdParamSchema,
  renewalMemberParamSchema,
  renewalYearParamSchema,
  renewalQuerySchema,
} from '../validators/renewalValidators';

const router = Router();

// Protect all renewal routes
router.use(authenticateAdmin);

router.post('/', validateRequest({ body: createRenewalSchema }), createRenewal);
router.get('/', validateRequest({ query: renewalQuerySchema }), getAllRenewals);
router.get('/member/:memberId', validateRequest({ params: renewalMemberParamSchema }), getRenewalsByMember);
router.get('/year/:year', validateRequest({ params: renewalYearParamSchema }), getRenewalsByYear);
router.put('/:id', validateRequest({ params: renewalIdParamSchema, body: updateRenewalSchema }), updateRenewal);
router.delete('/:id', validateRequest({ params: renewalIdParamSchema }), deleteRenewal);

export default router;
