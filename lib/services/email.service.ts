import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = 'MR POLAA <onboarding@resend.dev>';
const BRAND_COLOR = '#d97706'; // amber-600

function isConfigured() {
  const key = process.env.RESEND_API_KEY;
  return key && key !== 'your-resend-api-key-here';
}

// ─── OTP Email ────────────────────────────────────────────────────────────────

export async function sendOtpEmail(to: string, code: string) {
  if (!isConfigured()) {
    console.log(`[Email Mock] OTP for ${to}: ${code}`);
    return { success: true };
  }

  try {
    await resend.emails.send({
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
                      MR POLAA &mdash; Premium Grooming
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
                      Use the code below to complete your registration. It expires in 10 minutes.
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
                      &copy; 2026 MR POLAA. All rights reserved.
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
}

export async function sendBookingConfirmation(details: BookingEmailDetails) {
  if (!isConfigured()) {
    console.log(`[Email Mock] Booking confirmation for ${details.customerEmail}`);
    return { success: true };
  }

  const { customerName, customerEmail, bookingId, date, time, services, products, barberName, totalAmount } = details;
  const shortId = bookingId.slice(0, 8).toUpperCase();

  try {
    await resend.emails.send({
      from: FROM,
      to: customerEmail,
      subject: `Booking Confirmed — ${date} at ${time}`,
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
                      MR POLAA &mdash; Premium Grooming
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
                      See you soon, ${customerName}!
                    </h1>
                    <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.6;">
                      Your appointment at MR POLAA is confirmed. Here are your details.
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
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${services}</p>
                        </td>
                      </tr>
                      ${products ? `
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Products</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${products}</p>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding:20px 24px;border-bottom:1px solid #27272a;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Artisan</p>
                          <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">${barberName}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#52525b;">Total Paid</p>
                          <p style="margin:0;font-size:20px;font-weight:800;color:${BRAND_COLOR};">LKR ${totalAmount.toLocaleString()}</p>
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
                      &copy; 2026 MR POLAA. All rights reserved. &mdash; To cancel, visit your profile.
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
    return { success: true };
  } catch (err) {
    console.error('[Email] Booking confirmation failed:', err);
    return { success: false };
  }
}
