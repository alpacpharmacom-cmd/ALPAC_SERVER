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
    | 'intimate'
    | 'kids care'
    | 'oral care'
    | 'muscles & joints'
    | 'antiseptics'
    | 'anti scar'
    | 'vitamins'
    | 'supplements'
    | 'wellness';
  subcategory: string;
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
        'intimate',
        'kids care',
        'oral care',
        'muscles & joints',
        'antiseptics',
        'anti scar',
        'vitamins',
        'supplements',
        'wellness',
      ],
    },
    subcategory: {
      type: String,
      required: true,
      enum: [
        // skin care subcategories
        'dry skin', 'oily skin', 'sensitive skin', 'anti aging', 'hydration',
        // hair care subcategories
        'dry hair', 'oily hair', 'dandruff', 'hair loss', 'color protection',
        // intimate subcategories
        'wash', 'moisturizer', 'soothing',
        // kids care subcategories
        'skin protection', 'hair wash', 'body wash',
        // oral care subcategories
        'whitening', 'sensitive teeth', 'gum care', 'breath freshening',
        // muscles & joints subcategories
        'pain relief', 'massage', 'soothing',
        // antiseptics subcategories
        'sanitizer', 'wound care', 'skin prep',
        // anti scar subcategories
        'scar reduction', 'stretch marks', 'tissue repair',
        // vitamins subcategories
        'multivitamins', 'immunity', 'bone health', 'energy',
        // supplements subcategories
        'collagen', 'omega-3', 'protein', 'herbal',
        // wellness subcategories
        'stress relief', 'sleep aid', 'detox', 'digestion'
      ],
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
  },
  {
    timestamps: true,
  }
);

productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export { Product };
