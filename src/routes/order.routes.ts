import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  acceptOrder,
  declineOrder,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/order.controller';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware';
import {
  orderValidator,
  orderStatusValidator,
  mongoIdParamValidator,
  adminNoteValidator,
} from '../middleware/validator.middleware';

const router = express.Router();

// /api/orders
router.get('/myOrders', verifyToken, getMyOrders);
router.post('/', verifyToken, orderValidator, createOrder);
router.put('/:id/cancel', verifyToken, mongoIdParamValidator('id'), cancelOrder);

// Admin
router.get('/', verifyToken, verifyAdmin, getAllOrders);
router.get('/:id', verifyToken, verifyAdmin, mongoIdParamValidator('id'), getOrderById);
router.put(
  '/:id/accept',
  verifyToken,
  verifyAdmin,
  mongoIdParamValidator('id'),
  adminNoteValidator,
  acceptOrder
);
router.put(
  '/:id/decline',
  verifyToken,
  verifyAdmin,
  mongoIdParamValidator('id'),
  adminNoteValidator,
  declineOrder
);
router.put(
  '/:id/status',
  verifyToken,
  verifyAdmin,
  mongoIdParamValidator('id'),
  orderStatusValidator,
  updateOrderStatus
);
router.delete('/:id', verifyToken, verifyAdmin, mongoIdParamValidator('id'), deleteOrder);

export { router as orderRouter };
