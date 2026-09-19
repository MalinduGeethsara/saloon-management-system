// Low-stock alerts (the policy in ./notify.ts decides who hears: the owner, and managers who may see products).
//
// Products are decremented one unit at a time (website orders, walk-in bills), so alerting is done
// on the crossing instead of on every sale: once when a product drops below the low-stock line and
// once when it runs out, never on every unit in between.
import { db } from '../db';
import { notify } from './notify';

// Same line the Products page uses for its "Low Stock" tag (stock > 0 && stock < 10)
export const LOW_STOCK_THRESHOLD = 10;

export async function notifyIfLowStock(productId: string) {
  try {
    const product = await db.product.findUnique({ where: { id: productId }, select: { id: true, name: true, stock: true } });
    if (!product) return;

    const outOfStock = product.stock === 0;
    const justBecameLow = product.stock === LOW_STOCK_THRESHOLD - 1;
    if (!outOfStock && !justBecameLow) return;

    await notify({
      event: outOfStock ? 'STOCK_OUT' : 'STOCK_LOW',
      title: outOfStock ? 'Out of Stock' : 'Low Stock',
      desc: outOfStock
        ? `${product.name} is out of stock. Please restock.`
        : `${product.name} is running low: only ${product.stock} left. Please restock soon.`,
      sms: outOfStock
        ? `MR POLAA: Out of stock - ${product.name}. Please restock.`
        : `MR POLAA: Low stock - ${product.name} has ${product.stock} left. Please restock soon.`,
      ref: { type: 'PRODUCT', id: product.id },
      email: outOfStock
        ? {
            subject: `Out of stock - ${product.name}`,
            heading: 'A product ran out of stock',
            intro: 'Customers can no longer order it until it is restocked.',
            urgent: true,
            rows: [['Product', product.name], ['In stock', '0']],
          }
        : undefined,
    });
  } catch (err) {
    console.error('[Notify] low-stock alert failed silently:', err);
  }
}
