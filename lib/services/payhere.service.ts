import crypto from 'crypto';

function getPayHereConfig() {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

  if (!merchantId || !merchantSecret) {
    throw new Error('PAYHERE_MERCHANT_ID / PAYHERE_MERCHANT_SECRET are not set — cannot process PayHere payments.');
  }

  return { merchantId, merchantSecret };
}

function md5Upper(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex').toUpperCase();
}

export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export function getMerchantId(): string {
  return getPayHereConfig().merchantId;
}

let modeWarningLogged = false;

export function isSandbox(): boolean {
  const sandbox = (process.env.PAYHERE_MODE || 'sandbox').toLowerCase() !== 'live';

  // Say it once at the first payment, not on every single request
  if (!modeWarningLogged) {
    modeWarningLogged = true;
    if (process.env.NODE_ENV === 'production' && sandbox) {
      console.warn('[PayHere] Running in PRODUCTION with PAYHERE_MODE=sandbox — real payments will NOT be processed. Set PAYHERE_MODE=live when ready to go live.');
    }
    if (process.env.NODE_ENV !== 'production' && !sandbox) {
      console.warn('[PayHere] Running outside production with PAYHERE_MODE=live — this will attempt to move real money. Confirm this is intentional.');
    }
  }

  return sandbox;
}

// Checkout request hash — must be computed server-side only. The secret never reaches the client;
// only this final hash does. amount must be formatted with formatAmount() and that exact string
// sent as the checkout "amount" field, or the signature won't match on PayHere's side.
export function generateCheckoutHash(orderId: string, amount: number, currency: string = 'LKR'): string {
  const { merchantId, merchantSecret } = getPayHereConfig();
  const amountStr = formatAmount(amount);
  return md5Upper(`${merchantId}${orderId}${amountStr}${currency}${md5Upper(merchantSecret)}`);
}

interface NotifyParams {
  merchantId: string;
  orderId: string;
  payhereAmount: string;
  payhereCurrency: string;
  statusCode: string;
  md5sig: string;
}

// Verifies a PayHere server-to-server notify payload. Returns false for anything that doesn't
// match — callers must treat an unverified payload as untrusted and take no action on it.
export function verifyNotifySignature(params: NotifyParams): boolean {
  const { merchantId, merchantSecret } = getPayHereConfig();

  // Defense in depth: the hash below already implicitly binds to merchant_id, but checking it
  // explicitly first cheaply catches misconfiguration/cross-account payloads.
  if (params.merchantId !== merchantId) return false;
  if (!params.md5sig) return false;

  const expected = md5Upper(
    `${params.merchantId}${params.orderId}${params.payhereAmount}${params.payhereCurrency}${params.statusCode}${md5Upper(merchantSecret)}`
  );

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(params.md5sig.toUpperCase());

  return expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);
}
