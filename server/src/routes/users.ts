import express from 'express';
import {
  getUsers,
  getUser,
  getProfile,
  updateProfile,
  updateUserRole,
  deleteUser
} from '../controllers/userController';
import { protect, adminOnly } from '../middleware/auth';

const router = express.Router();

router.use(protect);

// Profile routes (any authenticated user)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// ✅ Allow all users to see user list (for chat)
router.get('/', getUsers);

router.get('/:id', getUser);
router.put('/:id/role', adminOnly, updateUserRole);
router.delete('/:id', adminOnly, deleteUser);

export default router;
