import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} from '../controllers/cart.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { cartItemValidator, mongoIdParamValidator } from '../middleware/validator.middleware';

const router = express.Router();

router.get('/', verifyToken, getCart);
router.post(
  '/:productId',
  verifyToken,
  mongoIdParamValidator('productId'),
  cartItemValidator,
  addToCart
);
router.put(
  '/:productId',
  verifyToken,
  mongoIdParamValidator('productId'),
  cartItemValidator,
  updateCartItemQuantity
);
router.delete('/:productId', verifyToken, mongoIdParamValidator('productId'), removeFromCart);
router.delete('/', verifyToken, clearCart);

export { router as cartRouter };
