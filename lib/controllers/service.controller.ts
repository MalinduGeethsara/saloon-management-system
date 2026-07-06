import { db } from '../db';

export async function createService(data: { name: string; description?: string; price: number; duration: number }) {
  return await db.service.create({ data });
}

export async function getAllServices() {
  return await db.service.findMany({ orderBy: { name: 'asc' } });
}

export async function getServiceById(id: string) {
  return await db.service.findUnique({ where: { id } });
}

export async function updateService(id: string, data: { name?: string; description?: string; price?: number; duration?: number }) {
  return await db.service.update({
    where: { id },
    data
  });
}

export async function deleteService(id: string) {
  return await db.service.delete({ where: { id } });
}
