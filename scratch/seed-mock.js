const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { role: 'CUSTOMER' } });
  const barbers = await prisma.user.findMany({ where: { role: 'BARBER' } });
  const services = await prisma.service.findMany();

  if (users.length === 0 || barbers.length === 0 || services.length === 0) {
    console.log("Missing users, barbers, or services. Cannot seed mock data.");
    return;
  }

  // Create a mock booking
  const booking = await prisma.booking.create({
    data: {
      date: new Date(Date.now() + 86400000), // Tomorrow
      status: 'CONFIRMED',
      totalAmount: services[0].price + (services[1]?.price || 0),
      customerId: users[0].id,
      barberId: barbers[0].id,
      services: {
        create: [
          { service: { connect: { id: services[0].id } } },
          ...(services[1] ? [{ service: { connect: { id: services[1].id } } }] : [])
        ]
      }
    }
  });
  
  await prisma.payment.create({
    data: {
      amount: booking.totalAmount,
      status: 'COMPLETED',
      method: 'CARD',
      bookingId: booking.id,
      customerId: users[0].id,
    }
  });

  console.log("Mock booking created successfully.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
