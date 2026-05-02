import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from './models/product.model';
import { User } from './models/user.model';
import bcrypt from 'bcryptjs';

const products = [
  {
    name: 'Alpac Glow Serum',
    image: '/images/products/glow_serum.png',
    category: 'cosmetics',
    subcategory: 'skin care',
    description: 'A revolutionary botanical serum enriched with eucalyptus and vitamin C to restore your natural radiance. Lightweight, fast-absorbing, and deeply hydrating.',
    price: 89.00,
    countInStock: 15,
    rating: 4.8,
    numReviews: 124,
  },
  {
    name: 'Midnight Renewal Cream',
    image: '/images/products/night_cream.png',
    category: 'cosmetics',
    subcategory: 'skin care',
    description: 'Luxurious overnight treatment that works while you sleep to firm, hydrate, and rejuvenate. Formulated with pure plant extracts and essential minerals.',
    price: 125.00,
    countInStock: 8,
    rating: 4.9,
    numReviews: 89,
  },
  {
    name: 'Daily Vitality Complex',
    image: '/images/products/vitality_supplement.png',
    category: 'nutrients',
    subcategory: 'vitamins',
    description: 'A comprehensive blend of energy-boosting botanicals and essential vitamins. Designed to support your active lifestyle and immune system naturally.',
    price: 55.00,
    countInStock: 24,
    rating: 4.7,
    numReviews: 210,
  },
  {
    name: 'Pure Botanical Facial Oil',
    image: '/images/products/glow_serum.png', // Reusing for variety in demo
    category: 'cosmetics',
    subcategory: 'skin care',
    description: '100% natural cold-pressed oils that nourish the skin barrier and lock in moisture for a dewy, youthful finish.',
    price: 72.00,
    countInStock: 5,
    rating: 4.6,
    numReviews: 45,
  },
  {
    name: 'Zen Mind Supplement',
    image: '/images/products/vitality_supplement.png', // Reusing for variety in demo
    category: 'nutrients',
    subcategory: 'wellness',
    description: 'Calm your mind and improve focus with our proprietary blend of adaptogens and cognitive-enhancing herbs.',
    price: 48.00,
    countInStock: 12,
    rating: 4.8,
    numReviews: 76,
  }
];

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');
    
    await mongoose.connect(uri);
    console.log('MongoDB Connected for seeding...');

    // 1. Ensure all configured admins have accounts
    const adminEmails = (process.env.ADMIN_EMAILS || 'admin@Alpac.com')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e !== '');
    
    console.log(`Ensuring ${adminEmails.length} admin accounts exist...`);
    
    const hashedPassword = await bcrypt.hash('Admin123!', 10);
    let firstAdmin: any = null;

    for (const email of adminEmails) {
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: `Admin (${email.split('@')[0]})`,
          email: email,
          password: hashedPassword,
          phone: '1234567890'
        });
        console.log(`+ Created admin account: ${email}`);
      } else {
        console.log(`- Admin account already exists: ${email}`);
      }
      if (!firstAdmin) firstAdmin = user;
    }

    // 2. Clear and seed products
    await Product.deleteMany({});
    console.log('Cleared existing products');

    const productsWithAdmin = products.map(p => ({
      ...p,
      user: firstAdmin!._id,
      reviews: []
    }));

    await Product.insertMany(productsWithAdmin);
    console.log('Seeded premium products successfully');

    await mongoose.disconnect();
    console.log('Seeding complete. Disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seed();
