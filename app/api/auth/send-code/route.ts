import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier) {
      return NextResponse.json({ success: false, message: 'Missing identifier' }, { status: 400 });
    }

    const isEmail = identifier.includes('@');
    const type = isEmail ? 'email' : 'sms';

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // In a production app, you would integrate Twilio SMS or SendGrid Email here.
    // We return the code so the simulator in frontend can mock receive it and display a notification.
    return NextResponse.json({
      success: true,
      code,
      type,
      identifier
    }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
