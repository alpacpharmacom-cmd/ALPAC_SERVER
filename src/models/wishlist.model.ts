import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlistItem extends Document {
  user: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
}

const wishlistSchema = new Schema<IWishlistItem>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Wishlist =
  mongoose.models.Wishlist || mongoose.model<IWishlistItem>('Wishlist', wishlistSchema);

export { Wishlist };
