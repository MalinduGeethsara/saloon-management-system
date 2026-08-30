import { db } from '../db';
import { createSession } from '../session';
import bcrypt from 'bcryptjs';

function normalizePhone(value: string) {
  if (!value.match(/^\+?[\d\s]+$/)) return value;
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.startsWith('94') && cleaned.length > 9) cleaned = cleaned.slice(2);
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  return cleaned;
}

export async function loginCustomer(emailOrPhone: string, passwordRaw: string) {
  const normalized = normalizePhone(emailOrPhone);

  // Find user in DB (Customer role ideally, but we'll check any role if needed, though this is customer login)
  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: emailOrPhone.toLowerCase() },
        { phone: normalized }
      ]
    }
  });

  if (!user) return null;

  const isPasswordValid = await bcrypt.compare(passwordRaw, user.password);
  if (!isPasswordValid) return null;

  // Create JWT session
  await createSession({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone,
  });

  return user;
}

export async function registerCustomer(data: { email?: string, phone?: string, passwordRaw: string, name: string }) {
  // In a real app, hash password before saving
  const hashedPassword = await bcrypt.hash(data.passwordRaw, 10);
  
  const user = await db.user.create({
    data: {
      email: data.email && data.email.trim() !== '' ? data.email.toLowerCase() : `${Date.now()}@temp.com`,
      phone: data.phone && data.phone.trim() !== '' ? normalizePhone(data.phone) : null,
      password: hashedPassword,
      name: data.name,
      role: 'CUSTOMER',
    }
  });

  await createSession({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone,
  });

  return user;
}

export async function loginStaff(emailOrPhone: string, passwordRaw: string) {
  const user = await db.user.findFirst({
    where: {
      OR: [
        { email: emailOrPhone.toLowerCase() },
        { phone: emailOrPhone }
      ],
      role: {
        not: 'CUSTOMER'
      }
    }
  });

  if (!user) return null;

  const isPasswordValid = await bcrypt.compare(passwordRaw, user.password);
  if (!isPasswordValid) return null;

  // Fetch dynamic permissions for this staff member
  const permissions = await db.staffPermission.findMany({
    where: { userId: user.id }
  });

  const fullPermissions = permissions.map(p => ({
    pageKey: p.pageKey,
    canView: p.canView,
    canAdd: p.canAdd,
    canEdit: p.canEdit,
    canDelete: p.canDelete
  }));

  await createSession({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    permissions: fullPermissions,
  });

  return user;
}
