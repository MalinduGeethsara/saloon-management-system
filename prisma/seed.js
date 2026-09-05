const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'owner@salon.com', phone: '+94770000001', password: defaultPassword, name: 'Nimesh Haththasingha', role: 'OWNER' },
    { email: 'manager@salon.com', phone: '+94770000002', password: defaultPassword, name: 'Sampath Madusanka', role: 'MANAGER' },
    { email: 'mahesh@salon.com', phone: '+94770000003', password: defaultPassword, name: 'Mahesh Madushanka', role: 'BARBER' },
    { email: 'malith@salon.com', phone: '+94770000004', password: defaultPassword, name: 'Malith Sandaruwan', role: 'BARBER' },
    { email: 'vindana@salon.com', phone: '+94770000005', password: defaultPassword, name: 'Vindana Lakmal', role: 'BARBER' },
    { email: 'barber@salon.com', phone: '+94770000006', password: defaultPassword, name: 'Generic Barber', role: 'BARBER' },
    { email: 'customer@salon.com', phone: '+94771234567', password: defaultPassword, name: 'Malindu Geethsara', role: 'CUSTOMER' }
  ];

  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    
    if (!existing) {
      await prisma.user.create({ data: user });
      console.log(`Created ${user.role}: ${user.email}`);
    } else {
      console.log(`User already exists: ${user.email}`);
    }
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
