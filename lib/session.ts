import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { getSessionSecret } from './secrets';

const encodedKey = new TextEncoder().encode(getSessionSecret());

export interface Permission {
  pageKey: string;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface SessionPayload extends JWTPayload {
  id: string;
  email: string;
  role: string;
  name: string;
  phone?: string | null;
  permissions?: Permission[];
  // First-run / handed-over password: the middleware keeps every page and API locked except the change-password page
  mustChangePassword?: boolean;
  [key: string]: any;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
  const session = await encrypt(payload);
  const cookieStore = await cookies();

  cookieStore.set('auth_token', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });

  // Keep these for frontend state if needed, but DO NOT trust them for auth validation
  cookieStore.set('user_role', payload.role, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });

  cookieStore.set('user_name', payload.name, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });

  if (payload.phone) {
    cookieStore.set('user_phone', payload.phone, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
      sameSite: 'lax',
      path: '/',
    });
  }

  if (payload.permissions) {
    cookieStore.set('user_permissions', JSON.stringify(payload.permissions), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      expires: expiresAt,
      sameSite: 'lax',
      path: '/',
    });
  }
}

export async function verifySession() {
  const cookieStore = await cookies();
  const session = cookieStore.get('auth_token')?.value;

  if (!session) return null;
  return await decrypt(session);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  cookieStore.delete('user_role');
  cookieStore.delete('user_name');
  cookieStore.delete('user_phone');
  cookieStore.delete('user_permissions');
}
