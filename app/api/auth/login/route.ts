import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// --- Hardcoded Temporary Database ---
const USERS = [
  { email: 'admin@salon.com', password: 'password123', role: 'admin', name: 'System Admin' },
  { email: 'owner@salon.com', password: 'password123', role: 'owner', name: 'Mali' },
  { email: 'manager@salon.com', password: 'password123', role: 'manager', name: 'Sarah' },  
  { email: 'barber@salon.com', password: 'password123', role: 'barber', name: 'Kasun' }     
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = USERS.find(u => u.email === email && u.password === password);

    if (user) {
      // FIX: Await the cookies() function for Next.js 15
      const cookieStore = await cookies(); 

      // 1. Secure HTTP-Only cookie (For Middleware security)
      cookieStore.set({
        name: 'auth_token',
        value: `secure_token_${user.role}_123`,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      // 2. Standard cookie (For UI to know the role)
      cookieStore.set({
        name: 'user_role',
        value: user.role,
        httpOnly: false, 
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      return NextResponse.json({ success: true, role: user.role, name: user.name }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}