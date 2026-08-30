// lib/services/sms.service.ts
// Notify.lk SMS gateway — https://developer.notify.lk/api-endpoints/

const NOTIFYLK_ENDPOINT = 'https://app.notify.lk/api/v1/send';
const NOTIFYLK_STATUS_ENDPOINT = 'https://app.notify.lk/api/v1/status';

interface NotifyLkSendResponse {
  status: string;
  data?: string;
}

// DB stores local format (e.g. "0771234567"); notify.lk expects "9471234567" (no +, no leading 0)
function normalizeSriLankanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('94')) return digits;
  if (digits.startsWith('0')) return `94${digits.slice(1)}`;
  return `94${digits}`;
}

// Sinhala/Tamil content must be sent as unicode — otherwise it arrives as garbled text
function isUnicodeMessage(message: string): boolean {
  return /[^\x00-\x7F]/.test(message);
}

export async function sendSms(phoneNumber: string, message: string) {
  const userId = process.env.NOTIFYLK_USER_ID;
  const apiKey = process.env.NOTIFYLK_API_KEY;
  const senderId = process.env.NOTIFYLK_SENDER_ID || 'NotifyDEMO';

  if (!userId || !apiKey) {
    console.warn('[SMS] NOTIFYLK_USER_ID/NOTIFYLK_API_KEY not set — SMS not sent');
    return { success: false, error: 'not_configured' as const };
  }

  const to = normalizeSriLankanPhone(phoneNumber);
  const body = new URLSearchParams({
    user_id: userId,
    api_key: apiKey,
    sender_id: senderId,
    to,
    message,
  });
  if (isUnicodeMessage(message)) {
    body.set('type', 'unicode');
  }

  try {
    const response = await fetch(NOTIFYLK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data: NotifyLkSendResponse | null = await response.json().catch(() => null);
    const success = response.ok && data?.status === 'success';

    if (!success) {
      console.error('[SMS] notify.lk send failed', { httpStatus: response.status, data });
    }

    return { success, raw: data };
  } catch (error) {
    console.error('[SMS] notify.lk request error', error);
    return { success: false, error: 'request_failed' as const };
  }
}

// Optional: surface a low-balance warning wherever it's useful (e.g. an admin dashboard widget)
export async function getSmsAccountBalance() {
  const userId = process.env.NOTIFYLK_USER_ID;
  const apiKey = process.env.NOTIFYLK_API_KEY;

  if (!userId || !apiKey) {
    return { success: false, error: 'not_configured' as const };
  }

  try {
    const url = `${NOTIFYLK_STATUS_ENDPOINT}?user_id=${encodeURIComponent(userId)}&api_key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);

    if (!response.ok || data?.status !== 'success') {
      console.error('[SMS] notify.lk status check failed', { httpStatus: response.status, data });
      return { success: false, error: 'request_failed' as const };
    }

    return { success: true, active: data.data?.active as boolean, balance: data.data?.acc_balance as number };
  } catch (error) {
    console.error('[SMS] notify.lk status request error', error);
    return { success: false, error: 'request_failed' as const };
  }
}
