import { NextResponse } from 'next/server';
import { loginStaff } from '@/lib/controllers/auth.controller';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = await loginStaff(email, password);

    if (user) {
      return NextResponse.json({ success: true, role: user.role, name: user.name }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Staff Login Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}