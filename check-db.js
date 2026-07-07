const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const shops = await prisma.shop.findMany();
  console.log("SHOPS:", shops);
}
main().catch(console.error).finally(() => prisma.$disconnect());
