import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { GRANTABLE_PAGES, PAGE_KEYS, resolveAccess } from '@/lib/access';
import { notifyAccessChanged } from '@/lib/services/notify';

// Only the owner hands out access, and only to managers and barbers
async function loadTarget(userId: unknown) {
  if (typeof userId !== 'string' || !userId) return null;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true, permissions: { where: { pageKey: { in: PAGE_KEYS } }, select: { pageKey: true, canView: true, canAdd: true, canEdit: true, canDelete: true } } },
  });
  if (!user || !['MANAGER', 'BARBER'].includes(user.role)) return null;
  return user;
}

export async function GET(request: Request) {
  const session = await verifySession();
  if (!session || !['OWNER', 'ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  try {
    const target = await loadTarget(userId);
    if (!target) return NextResponse.json({ error: 'Only managers and barbers have permissions' }, { status: 404 });

    // What the person can really do today: their saved rows, plus the working pages their role gets by default
    const permissions = GRANTABLE_PAGES.map((page) => {
      const a = resolveAccess(target.role, target.permissions, page.key);
      return { pageKey: page.key, canView: a.view, canAdd: a.add, canEdit: a.edit, canDelete: a.delete };
    });
    return NextResponse.json({ permissions, role: target.role, name: target.name });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session || !['OWNER', 'ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { userId, permissions } = await request.json();

    if (!userId || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const target = await loadTarget(userId);
    if (!target) return NextResponse.json({ error: 'Only managers and barbers have permissions' }, { status: 404 });

    // Only real, grantable pages; the same page twice keeps the last one. add/edit/delete need view.
    const byPage = new Map<string, { pageKey: string; canView: boolean; canAdd: boolean; canEdit: boolean; canDelete: boolean }>();
    const ignored: string[] = [];
    for (const p of permissions) {
      if (!p || typeof p.pageKey !== 'string' || !PAGE_KEYS.includes(p.pageKey)) {
        ignored.push(String(p?.pageKey));
        continue;
      }
      const canView = p.canView === true;
      byPage.set(p.pageKey, {
        pageKey: p.pageKey,
        canView,
        canAdd: canView && p.canAdd === true,
        canEdit: canView && p.canEdit === true,
        canDelete: canView && p.canDelete === true,
      });
    }
    const rows = Array.from(byPage.values());

    // Wrap in transaction for ACID safety. Every page sent is stored, including the unticked ones: an
    // explicit "no" also switches off a page the role would otherwise get by default.
    await db.$transaction(async (tx) => {
      await tx.staffPermission.deleteMany({ where: { userId } });
      if (rows.length > 0) {
        await tx.staffPermission.createMany({ data: rows.map((r) => ({ userId, ...r })) });
      }
    });

    void notifyAccessChanged(userId, target.role, target.permissions, rows, session.name);

    return NextResponse.json({ success: true, saved: rows.length, ignored });
  } catch (error: any) {
    console.error('Permission save error:', error);
    return NextResponse.json({ error: 'Failed to save permissions' }, { status: 500 });
  }
}
