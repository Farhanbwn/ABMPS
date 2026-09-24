import { Router } from 'express';
import {
  getMembers,
  getAllFilteredMembers,
  getNextSerial,
  getJoinYears,
  getMemberById,
  getMemberBySerial,
  createMember,
  updateMember,
  deleteMember,
} from '../controllers/memberController';
import { authenticateAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import {
  createMemberSchema,
  updateMemberSchema,
  memberIdParamSchema,
  memberSerialParamSchema,
  memberQuerySchema,
} from '../validators/memberValidators';

const router = Router();

// Protect all member routes
router.use(authenticateAdmin);

router.get('/', validateRequest({ query: memberQuerySchema }), getMembers);
router.get('/all', validateRequest({ query: memberQuerySchema }), getAllFilteredMembers);
router.get('/next-serial', getNextSerial);
router.get('/join-years', getJoinYears);
router.get('/serial/:serialNo', validateRequest({ params: memberSerialParamSchema }), getMemberBySerial);
router.get('/:id', validateRequest({ params: memberIdParamSchema }), getMemberById);
router.post('/', validateRequest({ body: createMemberSchema }), createMember);
router.put('/:id', validateRequest({ params: memberIdParamSchema, body: updateMemberSchema }), updateMember);
router.delete('/:id', validateRequest({ params: memberIdParamSchema }), deleteMember);

export default router;
