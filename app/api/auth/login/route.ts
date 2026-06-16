import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CUSTOMERS = [
  { email: 'customer@salon.com', password: 'password123', role: 'customer', name: 'Malindu Geethsara', phone: '+94 71 330 7710' }
];

function normalizePhone(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('94') && cleaned.length > 9) {
    cleaned = cleaned.slice(2);
  }
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, isRegister, name, phone } = body;

    const cookieStore = await cookies();

    // Sign Up/Registration Flow
    if (isRegister) {
      if ((!email && !phone) || !password || !name) {
        return NextResponse.json({ success: false, message: 'Missing required fields for signup' }, { status: 400 });
      }

      // Simulate saving to database by returning the registered user directly and setting cookies
      cookieStore.set({
        name: 'auth_token',
        value: `secure_token_customer_${Date.now()}`,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      cookieStore.set({
        name: 'user_role',
        value: 'customer',
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      cookieStore.set({
        name: 'user_name',
        value: name,
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      if (phone) {
        cookieStore.set({
          name: 'user_phone',
          value: phone,
          httpOnly: false,
          path: '/',
          maxAge: 60 * 60 * 24,
        });
      }

      return NextResponse.json({ success: true, role: 'customer', name, phone }, { status: 200 });
    }

    // Standard Login Flow
    const user = CUSTOMERS.find(c => {
      const isEmailMatch = c.email.toLowerCase() === (email || '').toLowerCase();
      const isPhoneMatch = c.phone && normalizePhone(c.phone) === normalizePhone(email || '');
      return (isEmailMatch || isPhoneMatch) && c.password === password;
    });

    if (user) {
      cookieStore.set({
        name: 'auth_token',
        value: `secure_token_customer_123`,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      cookieStore.set({
        name: 'user_role',
        value: user.role,
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      cookieStore.set({
        name: 'user_name',
        value: user.name,
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      cookieStore.set({
        name: 'user_phone',
        value: user.phone,
        httpOnly: false,
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return NextResponse.json({ success: true, role: user.role, name: user.name, phone: user.phone }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'Invalid customer credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
