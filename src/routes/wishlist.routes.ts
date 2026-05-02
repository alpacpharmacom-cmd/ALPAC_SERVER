import express from 'express';
import {
  getWishlist,
  toggleWishlistProduct,
  clearWishlist,
} from '../controllers/wishlist.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { mongoIdParamValidator } from '../middleware/validator.middleware';

const router = express.Router();

// All wishlist routes are protected
router.use(verifyToken);

router.get('/', getWishlist);
router.post('/:productId', mongoIdParamValidator('productId'), toggleWishlistProduct);
router.delete('/', clearWishlist);

export { router as wishlistRouter };
