import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';

// Load .env variables manually if needed, but tsx should load them.
// Ensure cloudinary is configured
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

const products = [
  {
    name: "Centella Ampoule Calming Hydrating Serum 100ml",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/CENT11_1Primary.webp?v=1781677590"
  },
  {
    name: "La Roche Posay Toleriane Purifying Foaming Cream Cleanser 125ml",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR48_1Primary.webp?v=1781677351"
  },
  {
    name: "La Roche Posay Effaclar Deep Cleansing Foaming Facial Cleanser 125ml",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR47_1Primary.webp?v=1781677117"
  },
  {
    name: "Cetaphil Gentle Skin Cleanser 473ml",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/CET65_1primaryimage.webp?v=1781676221"
  },
  {
    name: "Cetaphil Daily Facial Cleanser 473ml",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/Cetaphil_Daily_Facial_Cleanser_473ml_-_CET62-1_primary_1.webp?v=1743407864"
  },
  {
    name: "La Roche-Posay Hyalu B5 Suractive Anti-wrinkle Repairing Serum 30ml",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR46_1primaryimage.webp?v=1781339684"
  },
  {
    name: "Cantu Shea Butter Strengthening Styling Gel 524g",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/CANT001_1.jpg?v=1760071792"
  },
  {
    name: "La Roche Posay Mela B3 Gel Cleanser 200ml",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR45_1Primary.webp?v=1781268017"
  },
  {
    name: "La Roche Posay Vitamin C Purifying Cleanser 200ml",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR44_1Primary.webp?v=1781267669"
  },
  {
    name: "Jovees Dry Skin Full Pack 1",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/BU024_1.webp?v=1780660628"
  },
  {
    name: "Neutrogena Ultra Sheer Face Lotion Sunscreen SPF 50 88ml",
    img: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/Neutrogena_Ultra_Sheer_Face_Lotion_Sunscreen_SPF_50_88ml_-_NUSS02-1primary.webp?v=1743407572"
  }
];

const services = [
  {
    name: "Hair Cutting",
    img: "images/website/services/1.jpg"
  },
  {
    name: "Beard Cutting",
    img: "images/website/services/2.jpg"
  },
  {
    name: "Quick Head Massage",
    img: "images/website/services/3.jpg"
  },
  {
    name: "Oil Treatment",
    img: "images/website/services/4.jpg"
  },
  {
    name: "Gray Hair Cover",
    img: "images/website/services/5.jpg"
  },
  {
    name: "Full Facial Treatment",
    img: "images/website/services/6.jpg"
  },
  {
    name: "Gold Facial Treatment",
    img: "images/website/services/7.jpg"
  },
  {
    name: "Normal Facial Treatment",
    img: "images/website/services/8.jpg"
  },
  {
    name: "Gold Cleanup",
    img: "images/website/services/9.jpg"
  },
  {
    name: "Scrub",
    img: "images/website/services/10.jpg"
  },
  {
    name: "Ear Piercing",
    img: "images/website/services/11.jpg"
  },
  {
    name: "Nose Piercing",
    img: "images/website/services/12.jpg"
  },
  {
    name: "Tongue Piercing",
    img: "images/website/services/13.jpg"
  }
];

async function main() {
  console.log('Uploading product images to Cloudinary...');
  for (const product of products) {
    try {
      console.log(`Uploading ${product.name}...`);
      const result = await cloudinary.uploader.upload(product.img, { folder: 'salon/products' });
      await prisma.product.updateMany({
        where: { name: product.name },
        data: { imageUrl: result.secure_url }
      });
      console.log(`Updated product: ${product.name} with URL ${result.secure_url}`);
    } catch (e) {
      console.error(`Failed for product ${product.name}:`, e);
    }
  }

  console.log('\nUploading service images to Cloudinary...');
  for (const service of services) {
    try {
      console.log(`Uploading ${service.name}...`);
      const localPath = path.join(process.cwd(), 'public', service.img);
      const result = await cloudinary.uploader.upload(localPath, { folder: 'salon/services' });
      await prisma.service.updateMany({
        where: { name: service.name },
        data: { imageUrl: result.secure_url }
      });
      console.log(`Updated service: ${service.name} with URL ${result.secure_url}`);
    } catch (e) {
      console.error(`Failed for service ${service.name}:`, e);
    }
  }

  console.log('\nDone!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
