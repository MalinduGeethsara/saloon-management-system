const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

// This seed creates real login accounts. Running it against a production database with a
// shared/guessable password would leave OWNER/MANAGER accounts open to anyone. Require an
// explicit opt-in, and never fall back to a fixed password.
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
  console.error('Refusing to run prisma/seed.js with NODE_ENV=production. Set ALLOW_PROD_SEED=true to override.');
  process.exit(1);
}

async function main() {
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || crypto.randomBytes(12).toString('base64url');
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const users = [
    { email: 'owner@salon.com', phone: '+94770000001', password: hashedPassword, name: 'Nimesh Haththasingha', role: 'OWNER' },
    { email: 'manager@salon.com', phone: '+94770000002', password: hashedPassword, name: 'Sampath Madusanka', role: 'MANAGER' },
    { email: 'mahesh@salon.com', phone: '+94770000003', password: hashedPassword, name: 'Mahesh Madushanka', role: 'BARBER' },
    { email: 'malith@salon.com', phone: '+94770000004', password: hashedPassword, name: 'Malith Sandaruwan', role: 'BARBER' },
    { email: 'vindana@salon.com', phone: '+94770000005', password: hashedPassword, name: 'Vindana Lakmal', role: 'BARBER' },
    { email: 'barber@salon.com', phone: '+94770000006', password: hashedPassword, name: 'Generic Barber', role: 'BARBER' },
    { email: 'customer@salon.com', phone: '+94771234567', password: hashedPassword, name: 'Malindu Geethsara', role: 'CUSTOMER' }
  ];

  let createdAny = false;
  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });

    if (!existing) {
      await prisma.user.create({ data: user });
      console.log(`Created ${user.role}: ${user.email}`);
      createdAny = true;
    } else {
      console.log(`User already exists: ${user.email}`);
    }
  }

  if (createdAny && !process.env.SEED_DEFAULT_PASSWORD) {
    console.log(`\nGenerated password for newly-created accounts: ${defaultPassword}`);
    console.log('Save this now and change it after first login — it will not be shown again.');
  }

  console.log('All seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
