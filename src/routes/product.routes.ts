import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  deleteProductReview,
  getNewArrivals,
  getTopRatedProducts,
  getAllProducts,
  getAdminProductById,
} from '../controllers/product.controller';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware';
import {
  productValidator,
  updateProductValidator,
  productReviewValidator,
  mongoIdParamValidator,
} from '../middleware/validator.middleware';

const router = express.Router();

// /api/products
router.get('/', getProducts);
router.get('/top-rated', getTopRatedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/:id', mongoIdParamValidator('id'), getProductById);

router.post(
  '/:id/reviews',
  verifyToken,
  mongoIdParamValidator('id'),
  productReviewValidator,
  createProductReview
);

// Admin
router.get('/admin/allProducts', verifyToken, verifyAdmin, getAllProducts);
router.get(
  '/admin/allProducts/:id',
  verifyToken,
  verifyAdmin,
  mongoIdParamValidator('id'),
  getAdminProductById
);

router.post('/', verifyToken, verifyAdmin, productValidator, createProduct);
router.put(
  '/:id',
  verifyToken,
  verifyAdmin,
  mongoIdParamValidator('id'),
  updateProductValidator,
  updateProduct
);
router.delete('/:id', verifyToken, verifyAdmin, mongoIdParamValidator('id'), deleteProduct);

router.delete(
  '/:id/reviews/:reviewId',
  verifyToken,
  verifyAdmin,
  mongoIdParamValidator('id'),
  mongoIdParamValidator('reviewId'),
  deleteProductReview
);

export { router as productRouter };
