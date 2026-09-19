// A new manager or barber is welcomed by EMAIL (with their sign-in details) and by SMS (welcome + where to sign in).
// The password only travels by email, never by SMS: a text message is not private. When the account is created
// with "choose your own password at first sign-in" (the default) that emailed password is good for one sign-in only.
import { sendOwnerAlert } from './email.service';
import { sendSms } from './sms.service';
import { realEmail } from '../utils/real-email';
import { isValidSriLankanMobile } from '../utils/phone';

export type WelcomeResult = { email: 'sent' | 'no-email'; sms: 'sent' | 'no-number' | 'invalid-number' };

const ROLE_LABEL: Record<string, string> = { MANAGER: 'Manager', BARBER: 'Barber' };

const ROLE_HINT: Record<string, string> = {
  BARBER: 'You will see your own bookings, get a notification for every new booking assigned to you, and can follow your earnings.',
  MANAGER: 'You will see the pages the owner gives you access to, and get notifications for what you look after.',
};

function safe<T>(label: string, promise: Promise<T>) {
  promise.catch((err) => console.error(`[Welcome] ${label} failed silently:`, err));
}

export function welcomeNewStaff(staff: {
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  shopName?: string | null;
  password: string;
  mustChangePassword: boolean;
  addedBy?: string | null;
}): WelcomeResult {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
  const loginUrl = `${appUrl}/staff-login`;
  const firstName = staff.name.trim().split(/\s+/)[0] || 'there';
  const roleLabel = ROLE_LABEL[staff.role] || 'team member';
  const branch = staff.shopName ? ` at ${staff.shopName}` : '';

  let email: WelcomeResult['email'] = 'no-email';
  const to = realEmail(staff.email);
  if (to) {
    email = 'sent';
    safe('welcome email', sendOwnerAlert([to], {
      subject: 'Welcome to MR POLAA - your account is ready',
      banner: 'Welcome',
      audience: 'staff',
      heading: `Welcome to the team, ${firstName}!`,
      intro: `${staff.addedBy || 'The owner'} has added you to MR POLAA as a ${roleLabel}${branch}. ${ROLE_HINT[staff.role] || ''} Sign in with the details below${staff.mustChangePassword ? '; you will be asked to choose your own password the first time you sign in' : ''}.`,
      rows: [
        ['Your role', roleLabel],
        ['Branch', staff.shopName || ''],
        ['Sign in at', loginUrl],
        ['Your email (username)', staff.email],
        [staff.mustChangePassword ? 'Temporary password' : 'Password', staff.password],
      ],
      actionUrl: loginUrl,
      actionLabel: 'Sign in',
    }));
  }

  let sms: WelcomeResult['sms'] = 'no-number';
  const phone = (staff.phone || '').trim();
  if (phone) {
    if (isValidSriLankanMobile(phone)) {
      sms = 'sent';
      safe('welcome SMS', sendSms(
        phone,
        `MR POLAA: Welcome, ${firstName}! Your ${roleLabel.toLowerCase()} account is ready. Sign in at ${loginUrl || 'the staff login page'} with your email. Your password was sent to your email.`,
      ));
    } else {
      sms = 'invalid-number';
    }
  }
  return { email, sms };
}
