import { Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { Wishlist } from '../models/wishlist.model';
import { IProductBase } from '../models/product.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { successResponse } from '../utils/apiResponse';

export const getWishlist = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  const wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate({
      path: 'products',
      select: 'name image price countInStock discountPercentage stockStatus',
    })
    .lean();

  if (!wishlist) {
    await Wishlist.create({ user: req.user._id, products: [] });
    successResponse(res, [], 'Wishlist retrieved successfully');
    return;
  }

  const formattedProducts = ((wishlist as any).products as unknown as IProductBase[]).map(
    (product: IProductBase) => {
      if (product.countInStock !== undefined) {
        const status = product.countInStock > 0 ? 'In Stock' : 'Out of Stock';
        const rest = { ...product } as any;
        delete rest.countInStock;
        return {
          ...rest,
          stockStatus: status,
        };
      }
      return product;
    }
  );

  successResponse(res, formattedProducts, 'Wishlist retrieved successfully');
});

export const toggleWishlistProduct = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { productId } = req.params;
    const prodId = new mongoose.Types.ObjectId(productId as string);

    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [prodId] });
      successResponse(res, wishlist.products, 'Product added to wishlist');
      return;
    }

    const productIndex = wishlist.products.findIndex(
      (id: mongoose.Types.ObjectId) => id.toString() === productId
    );

    if (productIndex === -1) {
      wishlist.products.push(prodId);
      await wishlist.save();
      successResponse(res, wishlist.products, 'Product added to wishlist');
    } else {
      wishlist.products.splice(productIndex, 1);
      await wishlist.save();
      successResponse(res, wishlist.products, 'Product removed from wishlist');
    }
  }
);

export const clearWishlist = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    successResponse(res, [], 'Wishlist cleared successfully');
  }
);
