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

const router = Router();

// Protect all member routes
router.use(authenticateAdmin);

router.get('/', getMembers);
router.get('/all', getAllFilteredMembers);
router.get('/next-serial', getNextSerial);
router.get('/join-years', getJoinYears);
router.get('/serial/:serialNo', getMemberBySerial);
router.get('/:id', getMemberById);
router.post('/', createMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

export default router;
