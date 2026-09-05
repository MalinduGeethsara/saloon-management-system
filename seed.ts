import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  {
    name: "Centella Ampoule Calming Hydrating Serum 100ml",
    price: 9900,
    description: "Powered by Centella Asiatica extract, this lightweight ampoule calms irritation, reduces redness, and strengthens the skin barrier.",
    imageUrl: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/CENT11_1Primary.webp?v=1781677590",
    stock: 10,
    category: "Skincare"
  },
  {
    name: "La Roche Posay Toleriane Purifying Foaming Cream Cleanser 125ml",
    price: 12500,
    description: "A gentle purifying foaming cream cleanser formulated to cleanse skin while protecting its natural moisture barrier.",
    imageUrl: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR48_1Primary.webp?v=1781677351",
    stock: 15,
    category: "Skincare"
  },
  {
    name: "La Roche Posay Effaclar Deep Cleansing Foaming Facial Cleanser 125ml",
    price: 12500,
    description: "A deep cleansing foaming gel specifically formulated to gently eliminate impurities and excess sebum.",
    imageUrl: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR47_1Primary.webp?v=1781677117",
    stock: 5,
    category: "Skincare"
  },
  {
    name: "Cetaphil Gentle Skin Cleanser 473ml",
    price: 10500,
    description: "A dermatologist-recommended gentle skin cleanser that hydrates and soothes skin as it cleanses.",
    imageUrl: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/CET65_1primaryimage.webp?v=1781676221",
    stock: 20,
    category: "Skincare"
  },
  {
    name: "Cetaphil Daily Facial Cleanser 473ml",
    price: 10500,
    description: "Effectively removes dirt, excess oil, and impurities without stripping normal to oily skin of its natural moisture.",
    imageUrl: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/Cetaphil_Daily_Facial_Cleanser_473ml_-_CET62-1_primary_1.webp?v=1743407864",
    stock: 12,
    category: "Skincare"
  },
  {
    name: "La Roche-Posay Hyalu B5 Suractive Anti-wrinkle Repairing Serum 30ml",
    price: 10500,
    description: "Anti-wrinkle repairing serum formulated with hyaluronic acid and vitamin B5 to plump, hydrate, and repair the skin barrier.",
    imageUrl: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR46_1primaryimage.webp?v=1781339684",
    stock: 8,
    category: "Skincare"
  },
  {
    name: "Cantu Shea Butter Strengthening Styling Gel 524g",
    price: 7950,
    description: "Infused with pure shea butter to nourish strands while providing firm, flake-free control for textured and curly hair.",
    imageUrl: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/CANT001_1.jpg?v=1760071792",
    stock: 25,
    category: "Haircare"
  },
  {
    name: "La Roche Posay Mela B3 Gel Cleanser 200ml",
    price: 13500,
    description: "Enriched with Niacinamide and gentle PHA exfoliants, it helps refine skin texture, brighten complexion, and support barrier health.",
    imageUrl: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR45_1Primary.webp?v=1781268017",
    stock: 10,
    category: "Skincare"
  },
  {
    name: "La Roche Posay Vitamin C Purifying Cleanser 200ml",
    price: 13500,
    description: "A purifying facial cleanser enriched with Vitamin C to brighten, smooth, and refresh the skin.",
    imageUrl: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/LAR44_1Primary.webp?v=1781267669",
    stock: 6,
    category: "Skincare"
  },
  {
    name: "Jovees Dry Skin Full Pack 1",
    price: 11905,
    description: "A carefully selected dry skin collection combining essential products designed to cleanse, nourish, and revive skin.",
    imageUrl: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/BU024_1.webp?v=1780660628",
    stock: 3,
    category: "Sets"
  },
  {
    name: "Neutrogena Ultra Sheer Face Lotion Sunscreen SPF 50 88ml",
    price: 5900,
    description: "Lightweight face sunscreen with dry-touch technology and water-resistant protection, perfect for daily outdoor activities.",
    imageUrl: "https://cdn.shopify.com/s/files/1/0630/2036/7937/files/Neutrogena_Ultra_Sheer_Face_Lotion_Sunscreen_SPF_50_88ml_-_NUSS02-1primary.webp?v=1743407572",
    stock: 30,
    category: "Suncare"
  }
];

const services = [
  {
    name: "Hair Cutting",
    price: 500,
    description: "A precision haircut tailored to your preferences, complete with styling.",
    imageUrl: "images/website/services/1.jpg",
    duration: 30
  },
  {
    name: "Beard Cutting",
    price: 400,
    description: "Expert beard shaping, trimming, and lineup to compliment your face structure.",
    imageUrl: "images/website/services/2.jpg",
    duration: 20
  },
  {
    name: "Quick Head Massage",
    price: 400,
    description: "A relaxing head massage to ease tension, soothe stress, and improve circulation.",
    imageUrl: "images/website/services/3.jpg",
    duration: 15
  },
  {
    name: "Oil Treatment",
    price: 1500,
    description: "Nourishing hot oil hair treatment to condition your scalp and strengthen hair follicles.",
    imageUrl: "images/website/services/4.jpg",
    duration: 45
  },
  {
    name: "Gray Hair Cover",
    price: 1200,
    description: "Seamless coverage of gray hairs using premium, natural-looking coloring solutions.",
    imageUrl: "images/website/services/5.jpg",
    duration: 60
  },
  {
    name: "Full Facial Treatment",
    price: 6000,
    description: "Complete premium multi-step skin therapy including cleansing, scrub, mask, and deep hydration.",
    imageUrl: "images/website/services/6.jpg",
    duration: 60
  },
  {
    name: "Gold Facial Treatment",
    price: 5000,
    description: "Luxury skin rejuvenation infused with active gold elements for a bright, healthy glow.",
    imageUrl: "images/website/services/7.jpg",
    duration: 60
  },
  {
    name: "Normal Facial Treatment",
    price: 3500,
    description: "Standard facial cleansing and masking to refresh and clear your skin.",
    imageUrl: "images/website/services/8.jpg",
    duration: 45
  },
  {
    name: "Gold Cleanup",
    price: 4000,
    description: "Quick skin cleansing and tan removal treatment using premium gold scrubs and packs.",
    imageUrl: "images/website/services/9.jpg",
    duration: 30
  },
  {
    name: "Scrub",
    price: 1000,
    description: "Deep exfoliating facial scrub to clear dead skin cells and blackheads.",
    imageUrl: "images/website/services/10.jpg",
    duration: 20
  },
  {
    name: "Ear Piercing",
    price: 500,
    description: "Safe, quick, and hygienic ear piercing using sterile, premium studs.",
    imageUrl: "images/website/services/11.jpg",
    duration: 15
  },
  {
    name: "Nose Piercing",
    price: 1000,
    description: "Professional nose piercing performed under strict sterile conditions.",
    imageUrl: "images/website/services/12.jpg",
    duration: 15
  },
  {
    name: "Tongue Piercing",
    price: 2000,
    description: "Hygiene-first professional tongue piercing using medical-grade titanium bars.",
    imageUrl: "images/website/services/13.jpg",
    duration: 30
  }
];

async function main() {
  console.log('Seeding products...');
  for (const product of products) {
    const p = await prisma.product.create({
      data: product
    });
    console.log(`Created product: ${p.name}`);
  }

  console.log('Seeding services...');
  for (const service of services) {
    const s = await prisma.service.create({
      data: service
    });
    console.log(`Created service: ${s.name}`);
  }

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
