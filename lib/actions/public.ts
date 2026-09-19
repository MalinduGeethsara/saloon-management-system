'use server';

import { db } from '@/lib/db';

export async function getPublicBarbers() {
  try {
    const barbers = await db.user.findMany({
      where: {
        role: {
          in: ['BARBER', 'MANAGER', 'OWNER']
        }
      },
      select: {
        id: true,
        name: true,
        role: true,
        imageUrl: true,
        shopId: true,
        shop: {
          select: {
            name: true
          }
        }
      },
      take: 4 // Only get top 4 for the homepage
    });
    return barbers.map(barber => ({
      ...barber,
      imageUrl: barber.imageUrl && !barber.imageUrl.startsWith('/') && !barber.imageUrl.startsWith('http') 
        ? `/${barber.imageUrl}` 
        : barber.imageUrl
    }));
  } catch (error) {
    console.error("Failed to fetch barbers", error);
    return [];
  }
}

export async function getAllPublicBarbers() {
  try {
    const barbers = await db.user.findMany({
      where: {
        role: {
          in: ['BARBER', 'MANAGER', 'OWNER']
        }
      },
      select: {
        id: true,
        name: true,
        role: true,
        imageUrl: true,
        shopId: true,
        shop: {
          select: {
            name: true
          }
        }
      }
    });
    return barbers.map(barber => ({
      ...barber,
      imageUrl: barber.imageUrl && !barber.imageUrl.startsWith('/') && !barber.imageUrl.startsWith('http') 
        ? `/${barber.imageUrl}` 
        : barber.imageUrl
    }));
  } catch (error) {
    console.error("Failed to fetch all barbers", error);
    return [];
  }
}

export async function getPublicServices() {
  try {
    const services = await db.service.findMany({
      where: {
        status: 'Active'
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        imageUrl: true,
      },
      orderBy: { name: 'asc' },
      take: 6 // Homepage: 6 for the phone hero rail (desktop section shows the first 3)
    });
    return services.map(service => ({
      ...service,
      imageUrl: service.imageUrl && !service.imageUrl.startsWith('/') && !service.imageUrl.startsWith('http') 
        ? `/${service.imageUrl}` 
        : service.imageUrl
    }));
  } catch (error) {
    console.error("Failed to fetch services", error);
    return [];
  }
}

export async function getAllPublicServices() {
  try {
    const services = await db.service.findMany({
      where: {
        status: 'Active'
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        imageUrl: true,
      },
      orderBy: { name: 'asc' }
    });
    return services.map(service => ({
      ...service,
      imageUrl: service.imageUrl && !service.imageUrl.startsWith('/') && !service.imageUrl.startsWith('http') 
        ? `/${service.imageUrl}` 
        : service.imageUrl
    }));
  } catch (error) {
    console.error("Failed to fetch all services", error);
    return [];
  }
}

export async function getPublicProducts() {
  try {
    const products = await db.product.findMany({
      where: {
        status: 'Active'
      },
      select: {
        id: true,
        name: true,
        brand: true,
        category: true,
        description: true,
        price: true,
        stock: true,
        imageUrl: true,
      },
      orderBy: { name: 'asc' }
    });
    return products.map(product => ({
      ...product,
      imageUrl: product.imageUrl && !product.imageUrl.startsWith('/') && !product.imageUrl.startsWith('http')
        ? `/${product.imageUrl}`
        : product.imageUrl
    }));
  } catch (error) {
    console.error("Failed to fetch products", error);
    return [];
  }
}

export async function getPublicShops() {
  try {
    const shops = await db.shop.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        // The booking page shows the opening hours and greys out closed days/times up front
        status: true,
        operatingHours: true,
      },
      orderBy: { name: 'asc' }
    });
    return shops;
  } catch (error) {
    console.error("Failed to fetch shops", error);
    return [];
  }
}
