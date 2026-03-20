import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // FIX: Await the cookies() function for Next.js 15
    const cookieStore = await cookies(); 
    
    cookieStore.set({ 
      name: 'auth_token', 
      value: '', 
      httpOnly: true, 
      path: '/', 
      expires: new Date(0) 
    });
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}