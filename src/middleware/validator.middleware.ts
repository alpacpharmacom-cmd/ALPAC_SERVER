import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    const errorMsg = errors
      .array()
      .map((err: { msg?: string }) => err.msg || 'Validation Error')
      .join(', ');
    throw new Error(errorMsg);
  }
  next();
};

export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 30 })
    .withMessage('Name must be less than 30 characters')
    .escape(),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 10, max: 20 })
    .withMessage('Phone number must be between 10 and 20 characters')
    .escape(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 72 })
    .withMessage('Password must be between 6 and 72 characters'),
  validateRequest,
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest,
];

export const updateUserValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Name must be less than 50 characters')
    .escape(),

  body('oldPassword').optional(),
  body('newPassword')
    .optional()
    .isLength({ min: 6, max: 72 })
    .withMessage('New password must be between 6 and 72 characters'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number is too long')
    .escape(),
  body('avatar').optional().trim().isURL().withMessage('Avatar must be a valid URL'),
  body('address.street').optional().trim().escape(),
  body('address.city').optional().trim().escape(),
  body('address.state').optional().trim().escape(),
  body('address.zipCode').optional().trim().escape(),
  body('address.country').optional().trim().escape(),
  validateRequest,
];

// Param Validator for MongoDB IDs
export const mongoIdParamValidator = (paramName: string) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`),
  validateRequest,
];

// Product Validators
export const productValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ max: 100 })
    .escape(),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => value >= 0)
    .withMessage('Price cannot be negative'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .escape(),
  body('image').trim().notEmpty().withMessage('Image URL is required'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'skin care', 'hair care', 'intimate', 'kids care',
      'oral care', 'muscles & joints', 'antiseptics', 'anti scar',
      'vitamins', 'supplements', 'wellness'
    ])
    .withMessage('Category must be a valid ALPAC category'),
  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required')
    .isLength({ max: 100 })
    .escape(),
  body('healthGoal')
    .trim()
    .notEmpty()
    .withMessage('Health goal is required')
    .isLength({ max: 100 })
    .escape(),
  body('countInStock')
    .isInt({ min: 0 })
    .withMessage('Count in stock must be a non-negative integer'),
  validateRequest,
];

export const updateProductValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }).escape(),
  body('price')
    .optional()
    .isNumeric()
    .custom((value) => value >= 0),
  body('description').optional().trim().notEmpty().isLength({ max: 2000 }).escape(),
  body('image').optional().trim().notEmpty(),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .isIn([
      'skin care', 'hair care', 'intimate', 'kids care',
      'oral care', 'muscles & joints', 'antiseptics', 'anti scar',
      'vitamins', 'supplements', 'wellness'
    ])
    .withMessage('Category must be a valid ALPAC category'),
  body('brand').optional().trim().notEmpty().isLength({ max: 100 }).escape(),
  body('healthGoal').optional().trim().notEmpty().isLength({ max: 100 }).escape(),
  body('countInStock').optional().isInt({ min: 0 }),
  validateRequest,
];

export const productReviewValidator = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment')
    .trim()
    .notEmpty()
    .withMessage('Comment is required')
    .isLength({ max: 1000 })
    .escape(),
  validateRequest,
];

// Cart Validators
export const cartItemValidator = [
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  validateRequest,
];

// Order Validators
export const orderValidator = [
  body('orderItems').isArray({ min: 1, max: 50 }).withMessage('Order must contain between 1 and 50 items'),
  body('orderItems.*.product').isMongoId().withMessage('Invalid product ID in order items'),
  body('orderItems.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('shippingAddress').notEmpty().withMessage('Shipping address is required'),
  body('shippingAddress.street').trim().notEmpty().withMessage('Street is required').escape(),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required').escape(),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required').escape(),
  body('shippingAddress.zipCode').trim().notEmpty().withMessage('Zip Code is required').escape(),
  body('shippingAddress.country').trim().notEmpty().withMessage('Country is required').escape(),
  validateRequest,
];

export const orderStatusValidator = [
  body('status')
    .isIn(['processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid order status'),
  validateRequest,
];

// Forgot Password Validator
export const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  validateRequest,
];

// Reset Password Validator
export const resetPasswordValidator = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 72 })
    .withMessage('Password must be between 6 and 72 characters'),
  validateRequest,
];

// Admin Note Validator (for accept/decline order)
export const adminNoteValidator = [
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Note must be less than 500 characters')
    .escape(),
  validateRequest,
];
