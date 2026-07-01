import { Router } from 'express';
import { getDashboardStats } from '../controllers/admin.controller';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware';

const adminRouter = Router();

adminRouter.get('/stats', verifyToken, verifyAdmin, getDashboardStats);

export { adminRouter };
