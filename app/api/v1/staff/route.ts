import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { deleteCloudinaryImage } from '@/lib/cloudinary';
import { normalizePhone } from '@/lib/utils/phone';
import { PAGE_KEYS, resolveAccess } from '@/lib/access';
import { forbidden, getAccess } from '@/lib/access.server';
import { welcomeNewStaff } from '@/lib/services/staff-notifications';

// Staff can only ever be created/edited into these roles via this endpoint — letting the
// client pass an arbitrary `role` would let an OWNER-authenticated request mint an ADMIN account.
const ASSIGNABLE_ROLES = ['MANAGER', 'BARBER'];

const STAFF_PAGE = '/owner/staff';
const PAYROLL_PAGE = '/owner/hr/payroll';

// Who is asking, and what they may do here. The owner can do everything; anyone else only what the owner
// ticked for them on the Permissions page, and only ever to BARBER accounts (never to owners or managers, so
// nobody can hand themselves more access through this endpoint).
async function whoIsAsking() {
  const found = await getAccess(PAGE_KEYS);
  if (!found) return null;
  const { session, rows } = found;
  const isOwner = session.role === 'OWNER' || session.role === 'ADMIN';
  return {
    session,
    isOwner,
    anyPage: found.access.view,
    staff: resolveAccess(session.role, rows, STAFF_PAGE),
    payroll: resolveAccess(session.role, rows, PAYROLL_PAGE),
  };
}

export async function GET() {
  const who = await whoIsAsking();
  if (!who || !who.anyPage) return forbidden();

  try {
    // Everyone with a dashboard page gets the directory (who works here, which branch): the calendar,
    // bookings and attendance pages need it. Contact details need the Staff page, pay details Staff or Payroll.
    const contact = who.staff.view;
    const pay = who.staff.view || who.payroll.view;

    const staff = await db.user.findMany({
      where: {
        role: {
          notIn: ['CUSTOMER', 'OWNER', 'ADMIN']
        }
      },
      select: {
        id: true,
        name: true,
        email: contact,
        phone: contact,
        role: true,
        imageUrl: true,
        shopId: true,
        mustChangePassword: contact,
        salaryType: pay,
        baseSalary: pay,
        commissionRate: pay,
        shop: {
          select: { name: true }
        }
      }
    });

    return NextResponse.json({ staff });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const who = await whoIsAsking();
  if (!who || !who.staff.add) return forbidden();

  try {
    const data = await request.json();

    if (!ASSIGNABLE_ROLES.includes(data.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (!who.isOwner && data.role !== 'BARBER') {
      return NextResponse.json({ error: 'Only the owner can add managers' }, { status: 403 });
    }
    // Pay settings belong to the Payroll page: without Payroll access they are simply not set
    const mayPay = who.isOwner || who.payroll.edit || who.payroll.add;

    const generatedPassword = data.password || crypto.randomBytes(12).toString('base64url');
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const user = await db.user.create({
      data: {
        email: data.email,
        phone: data.phone ? normalizePhone(data.phone) : null,
        name: data.name,
        role: data.role, // 'MANAGER' or 'BARBER'
        password: hashedPassword,
        imageUrl: data.imageUrl || null,
        shopId: data.shopId || null,
        salaryType: mayPay ? data.salaryType || 'Commission' : 'Commission',
        baseSalary: mayPay ? parseFloat(data.baseSalary) || 0 : 0,
        commissionRate: mayPay ? parseFloat(data.commissionRate) || 0 : 0,
        // Only when the owner ticks "choose your own password at first sign-in" (the owner/admin made from .env are always asked)
        mustChangePassword: data.requirePasswordChange === true,
      }
    });

    // Welcome them: email with the sign-in details, SMS with where to sign in
    const shop = user.shopId ? await db.shop.findUnique({ where: { id: user.shopId }, select: { name: true } }) : null;
    const welcome = welcomeNewStaff({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      shopName: shop?.name,
      password: generatedPassword,
      mustChangePassword: user.mustChangePassword,
      addedBy: who.session.name,
    });

    const { password: _password, ...userWithoutPassword } = user;
    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      welcome,
      // Only returned when the caller didn't supply one — show it once so the owner can hand it off.
      generatedPassword: data.password ? undefined : generatedPassword,
    });
  } catch (error) {
    console.error('Failed to create staff:', error);
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const who = await whoIsAsking();
  if (!who || !(who.staff.edit || who.payroll.edit)) return forbidden();

  try {
    const data = await request.json();
    if (!data.id || typeof data.id !== 'string') return NextResponse.json({ error: 'ID required' }, { status: 400 });

    // This endpoint is also used for payroll-only updates (PayrollConfigModal), which send just
    // { id, salaryType, baseSalary, commissionRate, allowances } — role/name/email are omitted
    // there on purpose, so only validate role when the caller actually included it.
    if (data.role !== undefined && !ASSIGNABLE_ROLES.includes(data.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const identityFields = ['name', 'email', 'phone', 'role', 'imageUrl', 'shopId', 'password', 'requirePasswordChange'].filter((k) => data[k] !== undefined);
    const payFields = ['salaryType', 'baseSalary', 'commissionRate', 'allowances'].filter((k) => data[k] !== undefined);
    if (identityFields.length > 0 && !who.staff.edit) return forbidden();
    if (payFields.length > 0 && !(who.staff.edit || who.payroll.edit)) return forbidden();
    if (identityFields.length + payFields.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

    if (!who.isOwner) {
      // delegates look after barbers only
      const target = await db.user.findUnique({ where: { id: data.id }, select: { role: true } });
      if (!target || target.role !== 'BARBER') return forbidden('You can only change barber accounts');
      if (data.role !== undefined && data.role !== 'BARBER') return forbidden('Only the owner can make someone a manager');
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone ? normalizePhone(data.phone) : null;
    if (data.role !== undefined) updateData.role = data.role;

    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl;
    }

    if (data.salaryType !== undefined) updateData.salaryType = data.salaryType;
    if (data.baseSalary !== undefined) updateData.baseSalary = parseFloat(data.baseSalary) || 0;
    if (data.commissionRate !== undefined) updateData.commissionRate = parseFloat(data.commissionRate) || 0;
    if (data.allowances !== undefined) updateData.allowances = parseFloat(data.allowances) || 0;

    // Only touch the branch when the caller sent one: payroll-only updates omit it and must not
    // silently unassign the staff member from their shop.
    if (data.shopId !== undefined) updateData.shopId = data.shopId || null;

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    // The owner can switch "ask them to choose a new password at their next sign-in" on or off
    if (typeof data.requirePasswordChange === 'boolean') updateData.mustChangePassword = data.requirePasswordChange;

    const user = await db.user.update({
      where: { id: data.id },
      data: updateData
    });
    const { password: _password, ...userWithoutPassword } = user;
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Failed to update staff:', error);
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const who = await whoIsAsking();
  if (!who || !who.staff.delete) return forbidden();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const user = await db.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    // Only staff accounts are removed here: never an owner/admin, never a customer, never yourself
    if (!ASSIGNABLE_ROLES.includes(user.role) || user.id === who.session.id) {
      return NextResponse.json({ error: 'This account cannot be deleted here' }, { status: 403 });
    }
    if (!who.isOwner && user.role !== 'BARBER') return forbidden('You can only delete barber accounts');

    // Delete the record first: if the database refuses (history exists), the photo must stay
    await db.user.delete({ where: { id } });

    if (user.imageUrl) {
      await deleteCloudinaryImage(user.imageUrl).catch(() => {});
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    // P2003 = foreign key: commissions, payroll or attendance rows still reference this person
    if (error?.code === 'P2003') {
      return NextResponse.json({
        error: 'This person has commission, payroll or attendance history, so they cannot be deleted without losing those records. Keep the account and remove their permissions/branch instead.',
      }, { status: 409 });
    }
    console.error('Failed to delete staff:', error);
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
