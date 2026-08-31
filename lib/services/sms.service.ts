// lib/services/sms.service.ts
// Notify.lk SMS gateway — https://developer.notify.lk/api-endpoints/

import { toNotifyLkFormat } from '../utils/phone';

const NOTIFYLK_ENDPOINT = 'https://app.notify.lk/api/v1/send';
const NOTIFYLK_STATUS_ENDPOINT = 'https://app.notify.lk/api/v1/status';

interface NotifyLkSendResponse {
  status: string;
  data?: string;
}

// Sinhala/Tamil content must be sent as unicode — otherwise it arrives as garbled text
function isUnicodeMessage(message: string): boolean {
  return /[^\x00-\x7F]/.test(message);
}

// notify.lk rejects messages containing "unsupported content" — in practice this means smart
// quotes/dashes/odd spacing (e.g. Node's toLocaleString() emits a narrow no-break space before
// AM/PM on modern ICU builds) or actual emoji, even when sent with type=unicode. Normalize the
// common typographic look-alikes to plain ASCII and strip emoji outright, so genuine Sinhala/Tamil
// text is still preserved and sent as unicode, but accidental "smart" characters don't get rejected.
function sanitizeSmsMessage(message: string): string {
  return message
    .replace(/[‘’‚‛]/g, "'") // smart single quotes
    .replace(/[“”„‟]/g, '"') // smart double quotes
    .replace(/[–—]/g, '-') // en/em dash
    .replace(/…/g, '...') // ellipsis
    .replace(/[  -​ ]/g, ' ') // non-breaking/narrow/thin/zero-width spaces
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu, '') // emoji/pictographs
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export async function sendSms(phoneNumber: string, rawMessage: string) {
  const userId = process.env.NOTIFYLK_USER_ID;
  const apiKey = process.env.NOTIFYLK_API_KEY;
  const senderId = process.env.NOTIFYLK_SENDER_ID || 'NotifyDEMO';

  if (!userId || !apiKey) {
    console.warn('[SMS] NOTIFYLK_USER_ID/NOTIFYLK_API_KEY not set — SMS not sent');
    return { success: false, error: 'not_configured' as const };
  }

  const message = sanitizeSmsMessage(rawMessage);
  const to = toNotifyLkFormat(phoneNumber);
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
