import 'dotenv/config';
import mongoose from 'mongoose';
import { Product } from './models/product.model';
import { User } from './models/user.model';
import bcrypt from 'bcryptjs';

const products = [
  {
    name: 'Orizzonte Cream',
    image: '/images/products/orizzonte_cream.jpg',
    category: 'skin care',
    subcategory: 'hydration',
    description: 'Advanced dermatological cream for skin restoration and deep hydration. Formulated for sensitive skin with pure botanical extracts.',
    price: 45.00,
    countInStock: 20,
    rating: 4.9,
    numReviews: 56,
  },
  {
    name: 'Calmohist Lotion',
    image: '/images/products/calmohist_lotion2.jpg',
    category: 'skin care',
    subcategory: 'sensitive skin',
    description: 'Soothing lotion designed to calm skin irritation and provide long-lasting moisture. Ideal for daily ritual and restorative care.',
    price: 38.00,
    countInStock: 15,
    rating: 4.8,
    numReviews: 42,
  },
  {
    name: 'Gosay Face Wash',
    image: '/images/products/gosay_wash.jpg',
    category: 'skin care',
    subcategory: 'oily skin',
    description: 'Gentle clarifying facial wash that removes impurities while maintaining the skin\'s natural moisture barrier.',
    price: 32.00,
    countInStock: 30,
    rating: 4.7,
    numReviews: 89,
  },
  {
    name: 'Betalpac Solution',
    image: '/images/products/betalpac.jpg',
    category: 'antiseptics',
    subcategory: 'wound care',
    description: 'Professional grade solution for skin hygiene and protection. A staple in the ALPAC therapeutic botanical collection.',
    price: 28.00,
    countInStock: 50,
    rating: 4.9,
    numReviews: 15,
  },
  {
    name: 'Oilyan Essential Oil',
    image: '/images/products/oilyan.jpg',
    category: 'wellness',
    subcategory: 'stress relief',
    description: 'Pure botanical oils for holistic wellness and skin nourishment. Cold-pressed to preserve active nutrients.',
    price: 65.00,
    countInStock: 10,
    rating: 5.0,
    numReviews: 24,
  },
  {
    name: 'Ginoback Support',
    image: '/images/products/ginoback.jpg',
    category: 'supplements',
    subcategory: 'herbal',
    description: 'Specialized botanical supplement for internal wellness and metabolic support.',
    price: 52.00,
    countInStock: 18,
    rating: 4.6,
    numReviews: 31,
  },
  {
    name: 'Gosay RollOn Silver',
    image: '/images/products/gosay_rollon_silver.jpg',
    category: 'intimate',
    subcategory: 'wash',
    description: 'Premium roll-on protection with botanical extracts for all-day freshness and care.',
    price: 18.00,
    countInStock: 40,
    rating: 4.7,
    numReviews: 67,
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
