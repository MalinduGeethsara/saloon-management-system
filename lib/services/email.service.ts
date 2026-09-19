import { Resend } from 'resend';

// Created on first use, not at import: `new Resend(undefined)` throws, which would make `next build`
// (CI, or any environment without the key) fail while merely loading this file. Sending is already
// skipped by isConfigured() when there is no key.
let resendClient: Resend | null = null;
const resend = {
  emails: {
    send: (payload: Parameters<Resend['emails']['send']>[0]) => {
      resendClient ??= new Resend(process.env.RESEND_API_KEY);
      return resendClient.emails.send(payload);
    },
  },
};

// Defaults to Resend's shared sandbox sender, which can only deliver to your own Resend account
// email until a real domain is verified. Once mr-polaa.com is verified in Resend, set
// RESEND_FROM_EMAIL="MR POLAA <bookings@mr-polaa.com>" in .env — no code change needed.
const FROM = process.env.RESEND_FROM_EMAIL || 'MR POLAA <onboarding@resend.dev>';
const BRAND_COLOR = '#d97706'; // amber-600

// Names come from customers (registration / Google profile) and staff-entered catalogue data, so they
// must never be dropped into the HTML unescaped (an email from our own domain is a phishing gift).
function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const SALON_TAGLINE = 'Unisex Salon';
const SALON_PHONE = '+94 71 256 8071';
const SALON_EMAIL = 'mrpolaa.biz@gmail.com';

function isConfigured() {
  const key = process.env.RESEND_API_KEY;
  return key && key !== 'your-resend-api-key-here';
}

// ─── OTP Email ────────────────────────────────────────────────────────────────

export async function sendOtpEmail(to: string, code: string) {
  if (!isConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Email Mock] OTP for ${to}: ${code}`);
      return { success: true };
    }
    console.error('[Email] RESEND_API_KEY is not configured in production — OTP email not sent');
    return { success: false };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: 'Your MR POLAA Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:48px 16px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:4px;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:${BRAND_COLOR};padding:24px 32px;">
                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;color:#fff;">
                      MR POLAA &mdash; ${SALON_TAGLINE}
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:40px 32px;">
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
                      Verify your identity
                    </h1>
                    <p style="margin:0 0 32px;font-size:14px;color:#a1a1aa;line-height:1.6;">
                      Use the code below to verify your email address. It expires in 5 minutes.
                    </p>

                    <!-- Code box -->
                    <div style="background:#09090b;border:1px solid #3f3f46;border-radius:4px;padding:28px;text-align:center;margin-bottom:32px;">
                      <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:#71717a;">
                        Verification Code
                      </p>
                      <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:0.3em;color:${BRAND_COLOR};font-family:monospace;">
                        ${code}
                      </p>
                    </div>

                    <p style="margin:0;font-size:12px;color:#52525b;line-height:1.6;">
                      If you didn't request this, you can safely ignore this email. Someone may have entered your email by mistake.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #27272a;">
                    <p style="margin:0;font-size:11px;color:#3f3f46;">
                      &copy; 2026 Mr Polaa (PVT) LTD. All rights reserved.
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    if (error) {
      // The SDK returns API errors instead of throwing, so they must be checked explicitly
      console.error('[Email] OTP send rejected by Resend:', error);
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.error('[Email] OTP send failed:', err);
    return { success: false };
  }
}

// ─── Booking Confirmation Email ───────────────────────────────────────────────

interface BookingEmailDetails {
  customerName: string;
  customerEmail: string;
  bookingId: string;
  date: string;       // e.g. "Saturday, 30 August 2026"
  time: string;       // e.g. "10:00 AM"
  services: string;   // e.g. "Haircut, Hot Towel Shave"
  products?: string;  // e.g. "Argan Oil Shampoo, Beard Balm" — omitted when no products were added
  barberName: string;
  totalAmount: number;
  receiptNo?: string;       // e.g. "INV-1A2B3C" (same format as the Payments page in the dashboard)
  paymentMethod?: string;   // e.g. "PayHere (card)"
  paid?: boolean;           // default true. false = accepted by the salon, payment still due at the salon
}

export async function sendBookingConfirmation(details: BookingEmailDetails) {
  if (!isConfigured()) {
    console.log(`[Email Mock] Booking confirmation for ${details.customerEmail}`);
    return { success: true };
  }

  const { customerName, customerEmail, bookingId, date, time, services, products, barberName, totalAmount, receiptNo, paymentMethod } = details;
  const paid = details.paid !== false;
  const shortId = bookingId.slice(0, 8).toUpperCase();

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: customerEmail,
      subject: paid ? `Booking Confirmed & Payment Receipt — ${date} at ${time}` : `Booking Confirmed — ${date} at ${time}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:48px 16px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:4px;overflow:hidden;">

                <!-- Header -->
                <tr>
                  <td style="background:${BRAND_COLOR};padding:24px 32px;">
                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;color:#fff;">
                      MR POLAA &mdash; ${SALON_TAGLINE}
                    </p>
                  </td>
                </tr>

                <!-- Hero -->
                <tr>
                  <td style="padding:40px 32px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:${BRAND_COLOR};">
                      Booking Confirmed
                    </p>
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
                      See you soon, ${esc(customerName)}!
                    </h1>
                    <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.6;">
                      ${paid ? 'Your appointment at MR POLAA is confirmed and your payment was received. Please keep this email as your receipt.' : 'Your appointment at MR POLAA has been confirmed. Payment is due at the salon.'}
                    </p>
                  </td>
                </tr>

                <!-- Details Card -->
                <tr>
                  <td style="padding:0 32px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;border:1px solid #3f3f46;border-radius:4px;">
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Date &amp; Time</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${date} &mdash; ${time}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Services</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${esc(services)}</p>
                        </td>
                      </tr>
                      ${products ? `
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Products</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${esc(products)}</p>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Stylist</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${esc(barberName)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">${paid ? 'Total Paid' : 'Amount Due at the Salon'}</p>
                          <p style="margin:0;font-size:20px;font-weight:800;color:${BRAND_COLOR};">LKR ${totalAmount.toLocaleString()}</p>
                          ${paymentMethod || receiptNo ? `<p style="margin:6px 0 0;font-size:12px;color:#71717a;">${[paymentMethod ? esc(paymentMethod) : '', receiptNo ? `Receipt <span style="font-family:monospace;font-weight:700;">${esc(receiptNo)}</span>` : ''].filter(Boolean).join(' &middot; ')}</p>` : ''}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Booking ID -->
                <tr>
                  <td style="padding:0 32px 32px;">
                    <p style="margin:0;font-size:12px;color:#52525b;">
                      Booking reference: <span style="font-family:monospace;color:#71717a;font-weight:700;">#${shortId}</span>
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #27272a;">
                    <p style="margin:0;font-size:11px;color:#3f3f46;">
                      &copy; 2026 Mr Polaa (PVT) LTD. All rights reserved. &mdash; To cancel, visit your profile.
                    </p>
                  </td>
                </tr>

              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    if (error) {
      console.error('[Email] Booking confirmation rejected by Resend:', error);
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.error('[Email] Booking confirmation failed:', err);
    return { success: false };
  }
}

// ─── Booking Cancellation Email ───────────────────────────────────────────────

interface BookingCancellationDetails {
  customerName: string;
  customerEmail: string;
  bookingId: string;
  date: string;
  time: string;
  services: string;
  wasPaidOnline: boolean;
}

export async function sendBookingCancellation(details: BookingCancellationDetails) {
  if (!isConfigured()) {
    console.log(`[Email Mock] Booking cancellation for ${details.customerEmail}`);
    return { success: true };
  }

  const { customerName, customerEmail, bookingId, date, time, services, wasPaidOnline } = details;
  const shortId = bookingId.slice(0, 8).toUpperCase();

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: customerEmail,
      subject: `Booking Cancelled — ${date} at ${time}`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:48px 16px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:4px;overflow:hidden;">
                <tr>
                  <td style="background:${BRAND_COLOR};padding:24px 32px;">
                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;color:#fff;">
                      MR POLAA &mdash; ${SALON_TAGLINE}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:${BRAND_COLOR};">
                      Booking Cancelled
                    </p>
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
                      Hi ${esc(customerName)}, your booking was cancelled.
                    </h1>
                    <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.6;">
                      ${wasPaidOnline
                        ? 'Since you have already paid, our team will contact you about your refund. If you have any questions, please call or email us.'
                        : 'No payment was taken for this booking.'}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;border:1px solid #3f3f46;border-radius:4px;">
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Was scheduled for</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${date} &mdash; ${time}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Services</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${esc(services)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 32px;">
                    <p style="margin:0;font-size:12px;color:#52525b;line-height:1.7;">
                      Booking reference: <span style="font-family:monospace;color:#71717a;font-weight:700;">#${shortId}</span><br />
                      Need help? ${SALON_PHONE} &middot; ${SALON_EMAIL}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #27272a;">
                    <p style="margin:0;font-size:11px;color:#3f3f46;">
                      &copy; 2026 Mr Polaa (PVT) LTD. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    if (error) {
      console.error('[Email] Booking cancellation rejected by Resend:', error);
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.error('[Email] Booking cancellation failed:', err);
    return { success: false };
  }
}

// ─── Payment Receipt Email (payment taken at the salon) ───────────────────────

interface PaymentReceiptDetails {
  customerName: string;
  customerEmail: string;
  bookingId: string;
  receiptNo: string;
  date: string;
  services: string;
  products?: string;
  amount: number;
  method: string; // e.g. "Cash", "Card"
  referenceLabel?: string; // wording before the reference (default "Booking reference"; a walk-in bill says "Bill reference")
}

export async function sendPaymentReceipt(details: PaymentReceiptDetails) {
  if (!isConfigured()) {
    console.log(`[Email Mock] Payment receipt for ${details.customerEmail}`);
    return { success: true };
  }

  const { customerName, customerEmail, bookingId, receiptNo, date, services, products, amount, method, referenceLabel = 'Booking reference' } = details;
  const shortId = bookingId.slice(0, 8).toUpperCase();

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: customerEmail,
      subject: `Payment Receipt ${receiptNo} — MR POLAA`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:48px 16px;">
            <tr><td align="center">
              <table width="480" cellpadding="0" cellspacing="0" style="background:#18181b;border:1px solid #27272a;border-radius:4px;overflow:hidden;">
                <tr>
                  <td style="background:${BRAND_COLOR};padding:24px 32px;">
                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;color:#fff;">
                      MR POLAA &mdash; ${SALON_TAGLINE}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px 32px 24px;">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:${BRAND_COLOR};">
                      Payment Receipt
                    </p>
                    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
                      Thank you, ${esc(customerName)}!
                    </h1>
                    <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.6;">
                      We received your payment at MR POLAA. Please keep this email as your receipt.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;border:1px solid #3f3f46;border-radius:4px;">
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Receipt No.</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;font-family:monospace;">${esc(receiptNo)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Date</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${date}</p>
                        </td>
                      </tr>
                      ${services ? `
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Services</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${esc(services)}</p>
                        </td>
                      </tr>
                      ` : ''}
                      ${products ? `
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Products</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${esc(products)}</p>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Total Paid</p>
                          <p style="margin:0;font-size:20px;font-weight:800;color:${BRAND_COLOR};">LKR ${amount.toLocaleString()}</p>
                          <p style="margin:6px 0 0;font-size:12px;color:#71717a;">Paid by ${esc(method)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 32px 32px;">
                    <p style="margin:0;font-size:12px;color:#52525b;line-height:1.7;">
                      ${esc(referenceLabel)}: <span style="font-family:monospace;color:#71717a;font-weight:700;">#${shortId}</span><br />
                      Questions? ${SALON_PHONE} &middot; ${SALON_EMAIL}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;border-top:1px solid #27272a;">
                    <p style="margin:0;font-size:11px;color:#3f3f46;">
                      &copy; 2026 Mr Polaa (PVT) LTD. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });
    if (error) {
      console.error('[Email] Payment receipt rejected by Resend:', error);
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.error('[Email] Payment receipt failed:', err);
    return { success: false };
  }
}

// ─── Owner alerts (new bookings, orders, things that need action) ─────────────

interface OwnerAlertDetails {
  subject: string;
  heading: string;
  intro?: string;
  rows: [label: string, value: string][];
  urgent?: boolean; // red banner: something needs the owner to act (refund, oversold stock ...)
  audience?: 'owner' | 'staff'; // wording of the banner and footer (default: owner)
  banner?: string; // replaces the word in the coloured banner (e.g. "Welcome")
  actionUrl?: string;
  actionLabel?: string;
}

export async function sendOwnerAlert(to: string[], details: OwnerAlertDetails) {
  const recipients = Array.from(new Set(to.map(t => t.trim().toLowerCase()).filter(Boolean)));
  if (recipients.length === 0) return { success: false };

  if (!isConfigured()) {
    console.log(`[Email Mock] Owner alert "${details.subject}" for ${recipients.join(', ')}`);
    return { success: true };
  }

  const { heading, intro, rows, urgent, actionUrl, actionLabel } = details;
  const accent = urgent ? '#dc2626' : BRAND_COLOR;
  // one line, no control characters in the subject
  const subject = details.subject.replace(/[\r\n]+/g, ' ').slice(0, 150);

  const rowsHtml = rows
    .filter(([, value]) => value !== '' && value !== undefined && value !== null)
    .map(([label, value]) => `
                        <tr>
                          <td style="padding:8px 0;font-size:12px;color:#71717a;width:130px;vertical-align:top;">${esc(label)}</td>
                          <td style="padding:8px 0;font-size:14px;color:#fff;font-weight:600;">${esc(value)}</td>
                        </tr>`)
    .join('');

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: recipients,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Helvetica Neue',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:32px 12px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="max-width:100%;background:#18181b;border:1px solid #27272a;border-radius:4px;overflow:hidden;">
                <tr>
                  <td style="background:${accent};padding:20px 28px;">
                    <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;color:#fff;">
                      MR POLAA &mdash; ${esc(details.banner || (urgent ? 'Action needed' : details.audience === 'staff' ? 'Team update' : 'Owner alert'))}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 28px 8px;">
                    <h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#fff;letter-spacing:-0.3px;">${esc(heading)}</h1>
                    ${intro ? `<p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.6;">${esc(intro)}</p>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 28px 8px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #27272a;">${rowsHtml}
                    </table>
                  </td>
                </tr>
                ${actionUrl ? `
                <tr>
                  <td style="padding:16px 28px 28px;">
                    <a href="${esc(actionUrl)}" style="display:inline-block;background:${accent};color:#fff;text-decoration:none;font-weight:800;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:14px 26px;">${esc(actionLabel || 'Open dashboard')}</a>
                  </td>
                </tr>` : '<tr><td style="padding:0 0 16px;"></td></tr>'}
                <tr>
                  <td style="padding:16px 28px;border-top:1px solid #27272a;">
                    <p style="margin:0;font-size:11px;color:#52525b;">${details.audience === 'staff' ? 'You receive this because you are part of the MR POLAA team.' : 'You receive this because you are the owner of MR POLAA.'} &copy; 2026 Mr Polaa (PVT) LTD.</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Owner alert rejected by Resend:', error);
      return { success: false };
    }
    return { success: true };
  } catch (err) {
    console.error('[Email] Owner alert failed:', err);
    return { success: false };
  }
}
