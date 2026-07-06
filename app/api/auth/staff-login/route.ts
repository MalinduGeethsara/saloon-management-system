import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const USERS = [
  { email: 'admin@salon.com', password: 'password123', role: 'admin', name: 'System Admin' },
  { email: 'owner@salon.com', password: 'password123', role: 'owner', name: 'Nimesh Haththasingha' },
  { email: 'manager@salon.com', password: 'password123', role: 'manager', name: 'Sampath Madusanka' },  
  { email: 'mahesh@salon.com', password: 'password123', role: 'barber', name: 'Mahesh Madushanka', barberId: '2', attendanceId: '1', empId: 'EMP-001' },
  { email: 'malith@salon.com', password: 'password123', role: 'barber', name: 'Malith Sandaruwan', barberId: '1', attendanceId: '2', empId: 'EMP-002' },
  { email: 'vindana@salon.com', password: 'password123', role: 'barber', name: 'Vindana Lakmal', barberId: '3', attendanceId: '3', empId: 'EMP-003' },
  { email: 'barber@salon.com', password: 'password123', role: 'barber', name: 'Barber', barberId: '2', attendanceId: '1', empId: 'EMP-001' }     
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const user = USERS.find(u => u.email === email && u.password === password);

    if (user) {
      const cookieStore = await cookies(); 

      cookieStore.set({
        name: 'auth_token',
        value: `secure_token_${user.role}_123`,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      // 2. Standard cookie
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
        maxAge: 60 * 60 * 24, // 1 day
      });

      if ('barberId' in user) {
        cookieStore.set({
          name: 'barber_id',
          value: user.barberId as string,
          httpOnly: false,
          path: '/',
          maxAge: 60 * 60 * 24,
        });
      }
      if ('attendanceId' in user) {
        cookieStore.set({
          name: 'attendance_id',
          value: user.attendanceId as string,
          httpOnly: false,
          path: '/',
          maxAge: 60 * 60 * 24,
        });
      }
      if ('empId' in user) {
        cookieStore.set({
          name: 'emp_id',
          value: user.empId as string,
          httpOnly: false,
          path: '/',
          maxAge: 60 * 60 * 24,
        });
      }

      return NextResponse.json({ success: true, role: user.role, name: user.name }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}