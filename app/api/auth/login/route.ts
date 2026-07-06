import { NextResponse } from 'next/server';
import { loginCustomer, registerCustomer } from '@/lib/controllers/auth.controller';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, isRegister, name, phone } = body;

    if (isRegister) {
      if ((!email && !phone) || !password || !name) {
        return NextResponse.json({ success: false, message: 'Missing required fields for signup' }, { status: 400 });
      }

      const user = await registerCustomer({ email, phone, passwordRaw: password, name });
      return NextResponse.json({ success: true, role: user.role, name: user.name, phone: user.phone }, { status: 200 });
    }

    // Standard Login
    const user = await loginCustomer(email || phone, password);

    if (user) {
      return NextResponse.json({ success: true, role: user.role, name: user.name, phone: user.phone }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'Invalid customer credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
