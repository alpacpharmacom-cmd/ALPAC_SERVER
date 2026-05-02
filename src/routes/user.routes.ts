import express from 'express';
import {
  registerUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  forgotPassword,
  resetPassword,
} from '../controllers/user.controller';
import {
  registerValidator,
  loginValidator,
  updateUserValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  mongoIdParamValidator,
} from '../middleware/validator.middleware';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// /api/users
router.post('/register', registerValidator, registerUser);
router.post('/login', loginValidator, loginUser);
router.post('/logout', logoutUser);
router.post('/forgotpassword', forgotPasswordValidator, forgotPassword);
router.put('/resetpassword/:resettoken', resetPasswordValidator, resetPassword);

router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserValidator, updateUserProfile);

// Admin
//router.post('/createUser', registerValidator, createUser);
router.get('/', verifyToken, verifyAdmin, getUsers);
router.get('/:id', verifyToken, verifyAdmin, mongoIdParamValidator('id'), getUserById);
router.put('/:id', verifyToken, verifyAdmin, mongoIdParamValidator('id'), updateUserValidator, updateUser);
router.delete('/:id', verifyToken, verifyAdmin, mongoIdParamValidator('id'), deleteUser);

export { router as userRouter };
