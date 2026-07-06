// lib/services/sms.service.ts
export async function sendSms(phoneNumber: string, message: string) {
  // TODO: Integrate actual SMS gateway (e.g., Twilio, Notify.lk, Dialog)
  console.log(`[SMS Gateway Mock] Sending to ${phoneNumber}: ${message}`);
  // Return mock success
  return { success: true, messageId: `mock_${Date.now()}` };
}
