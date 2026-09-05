import { db } from '../db';

export async function createProduct(data: { name: string; description?: string; price: number; stock: number; brand?: string; category?: string; sku?: string; imageUrl?: string }) {
  return await db.product.create({ data });
}

export async function getAllProducts() {
  return await db.product.findMany({ orderBy: { name: 'asc' } });
}

export async function getProductById(id: string) {
  return await db.product.findUnique({ where: { id } });
}

export async function updateProduct(id: string, data: { name?: string; description?: string; price?: number; stock?: number; brand?: string; category?: string; sku?: string; imageUrl?: string; status?: string }) {
  return await db.product.update({
    where: { id },
    data
  });
}

export async function deleteProduct(id: string) {
  return await db.product.delete({ where: { id } });
}
