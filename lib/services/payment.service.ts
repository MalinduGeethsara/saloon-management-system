// lib/services/payment.service.ts
//
// This mock is only used by the admin/walk-in booking path (lib/controllers/booking.controller.ts).
// The customer-facing booking wizard is now integrated with the real PayHere gateway instead —
// see lib/services/payhere.service.ts and app/api/v1/payments/payhere/notify/route.ts.
export async function processPayment(amount: number, method: string, token: string) {
  // TODO: Integrate a real gateway for the admin/walk-in path too, if ever needed.
  console.log(`[Payment Gateway Mock] Processing ${amount} via ${method}`);
  // Return mock success
  return { success: true, transactionId: `txn_mock_${Date.now()}` };
}
