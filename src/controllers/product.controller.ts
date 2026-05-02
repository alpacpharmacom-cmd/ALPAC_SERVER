import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { Product, IProductBase, IFormattedProduct } from '../models/product.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { successResponse } from '../utils/apiResponse';

export const getProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const products = await Product.find({})
    .select(
      '_id name image description category subcategory price oldPrice discountPercentage rating numReviews countInStock reviews'
    )
    .lean();

  const formattedProducts: IFormattedProduct[] = products.map((product: any) => {
    const status = product.countInStock > 0 ? 'In Stock' : 'Out of Stock';
    const rest = { ...product };
    delete rest.countInStock;
    return {
      ...rest,
      stockStatus: status,
    };
  });

  successResponse(res, formattedProducts, 'Products retrieved successfully');
});

export const getTopRatedProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const products = await Product.find({})
    .sort({ rating: -1, numReviews: -1 })
    .limit(8)
    .select('_id name image description category subcategory price oldPrice discountPercentage rating numReviews countInStock')
    .lean();

  const formattedProducts = products.map((product: any) => {
    const status = product.countInStock > 0 ? 'In Stock' : 'Out of Stock';
    const rest = { ...product };
    delete rest.countInStock;
    return { ...rest, stockStatus: status };
  });

  successResponse(res, formattedProducts, 'Top rated products retrieved successfully');
});

export const getNewArrivals = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const products = await Product.find({})
    .sort({ createdAt: -1 })
    .limit(8)
    .select('_id name image description category subcategory price oldPrice discountPercentage rating numReviews countInStock')
    .lean();

  const formattedProducts = products.map((product: any) => {
    const status = product.countInStock > 0 ? 'In Stock' : 'Out of Stock';
    const rest = { ...product };
    delete rest.countInStock;
    return { ...rest, stockStatus: status };
  });

  successResponse(res, formattedProducts, 'New arrivals retrieved successfully');
});

export const getProductById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await Product.findById(req.params.id).lean();

  if (product) {
    const productBase = product as unknown as IProductBase;
    const status = productBase.countInStock > 0 ? 'In Stock' : 'Out of Stock';
    const rest = { ...productBase } as any;
    delete rest.countInStock;

    const productObj: IFormattedProduct = {
      ...rest,
      stockStatus: status,
    };

    successResponse(res, productObj, 'Product details retrieved successfully');
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

export const getAllProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const products = await Product.find({});
  successResponse(res, products, 'Products retrieved successfully');
});

export const getAdminProductById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const product = await Product.findById(req.params.id);

    if (product) {
      successResponse(res, product, 'Product details retrieved successfully');
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  }
);

export const deleteProduct = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: product._id });
      successResponse(res, null, 'Product removed successfully');
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  }
);

export const createProduct = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, price, description, image, category, subcategory, countInStock, oldPrice, discountPercentage } =
      req.body;

    const product = new Product({
      name,
      price,
      user: req.user._id,
      image,
      category,
      subcategory,
      countInStock,
      oldPrice: oldPrice || 0,
      discountPercentage: discountPercentage || 0,
      numReviews: 0,
      description,
    });

    const createdProduct = await product.save();
    successResponse(res, createdProduct, 'Product created successfully', 201);
  }
);

export const updateProduct = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, price, description, image, category, subcategory, countInStock, oldPrice, discountPercentage } =
      req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name !== undefined ? name : product.name;
      product.price = price !== undefined ? price : product.price;
      product.description = description !== undefined ? description : product.description;
      product.image = image !== undefined ? image : product.image;
      product.category = category !== undefined ? category : product.category;
      product.subcategory = subcategory !== undefined ? subcategory : product.subcategory;
      product.countInStock = countInStock !== undefined ? countInStock : product.countInStock;
      product.oldPrice = oldPrice !== undefined ? oldPrice : product.oldPrice;
      product.discountPercentage = discountPercentage !== undefined ? discountPercentage : product.discountPercentage;

      const updatedProduct = await product.save();
      successResponse(res, updatedProduct, 'Product updated successfully');
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  }
);

export const createProductReview = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { rating, comment } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r: { userId: { toString: () => string } }) =>
          r.userId.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        res.status(400);
        throw new Error('Product already reviewed');
      }

      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        userId: req.user._id,
      };

      product.reviews.push(review);

      product.numReviews = product.reviews.length;

      product.rating =
        product.reviews.reduce((acc: number, item: { rating: number }) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      successResponse(res, null, 'Review added successfully', 201);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  }
);

export const deleteProductReview = asyncHandler(
  async (req: AuthRequest, res: Response): Promise<void> => {
    const product = await Product.findById(req.params.id);

    if (product) {
      const reviewIndex = product.reviews.findIndex(
        (r: { _id: { toString: () => string } }) => r._id.toString() === req.params.reviewId
      );

      if (reviewIndex === -1) {
        res.status(404);
        throw new Error('Review not found');
      }

      product.reviews.splice(reviewIndex, 1);

      product.numReviews = product.reviews.length;

      if (product.numReviews > 0) {
        product.rating =
          product.reviews.reduce((acc: number, item: { rating: number }) => item.rating + acc, 0) /
          product.reviews.length;
      } else {
        product.rating = 0;
      }

      await product.save();
      successResponse(res, null, 'Review removed successfully');
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  }
);
