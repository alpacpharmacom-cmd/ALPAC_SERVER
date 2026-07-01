import mongoose, { Schema, Document } from 'mongoose';

export interface IReview {
  _id: mongoose.Types.ObjectId;
  name: string;
  rating: number;
  comment: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IProductBase {
  name: string;
  image: string;
  category:
    | 'skin care'
    | 'hair care'
    | 'oral care'
    | 'muscles & joints'
    | 'antiseptics'
    | 'anti scar'
    | 'nutrients';
  brand: string;
  healthGoal: string;
  description: string;
  rating: number;
  numReviews: number;
  price: number;
  oldPrice?: number;
  discountPercentage?: number;
  countInStock: number;
  reviews: IReview[];
  offer?: {
    buy: number;
    get: number;
    isActive: boolean;
  };
  isActive: boolean;
  ingredients?: string;
  howToUse?: string;
  user: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct extends IProductBase, Document {}

export interface IFormattedProduct extends Omit<IProductBase, 'countInStock'> {
  stockStatus: 'In Stock' | 'Out of Stock';
}

const reviewSchema = new Schema<IReview>(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'skin care',
        'hair care',
        'oral care',
        'muscles & joints',
        'antiseptics',
        'anti scar',
        'nutrients',
      ],
    },
    brand: {
      type: String,
      required: true,
      default: '',
    },
    healthGoal: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      default: 0,
    },
    numReviews: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    oldPrice: {
      type: Number,
      default: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
    },
    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },
    reviews: [reviewSchema],
    offer: {
      buy: { type: Number, default: 0 },
      get: { type: Number, default: 0 },
      isActive: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    ingredients: {
      type: String,
      default: '',
    },
    howToUse: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ healthGoal: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export { Product };
