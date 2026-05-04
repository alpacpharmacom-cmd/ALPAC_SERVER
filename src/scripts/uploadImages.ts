import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Product } from '../models/product.model';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const IMAGES_DIR = path.join(__dirname, '../../../final images');
const DEFAULT_QUANTITY = 10;

async function uploadAndSeed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to MongoDB');

    // Read images from directory
    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter(file => 
      ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())
    );

    console.log(`Found ${imageFiles.length} images to upload.`);

    for (const file of imageFiles) {
      const filePath = path.join(IMAGES_DIR, file);
      const fileName = path.parse(file).name;

      console.log(`Uploading ${file}...`);

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'products',
        public_id: fileName.replace(/[^a-zA-Z0-9]/g, '_'), // Clean filename for public_id
      });

      console.log(`Uploaded: ${result.secure_url}`);

      // Check if product already exists
      const existingProduct = await Product.findOne({ name: fileName });

      if (existingProduct) {
        console.log(`Product "${fileName}" already exists. Updating image and stock.`);
        existingProduct.image = result.secure_url;
        existingProduct.countInStock = DEFAULT_QUANTITY;
        await existingProduct.save();
      } else {
        console.log(`Creating new product for "${fileName}"...`);
        // Note: Adding default values for required fields in the schema
        await Product.create({
          name: fileName,
          image: result.secure_url,
          category: 'cosmetics', // Default category
          subcategory: 'skin care', // Default subcategory
          description: `High-quality ${fileName} for your care routine.`,
          price: 0,
          countInStock: DEFAULT_QUANTITY,
          rating: 0,
          numReviews: 0,
        });
      }
    }

    console.log('Finished uploading and seeding products.');
    process.exit(0);
  } catch (error) {
    console.error('Error during upload and seed:', error);
    process.exit(1);
  }
}

uploadAndSeed();
