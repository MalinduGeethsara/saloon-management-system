import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { refreshSessionIfStale } from '@/lib/access.server';
import { serverError } from '@/lib/api-error';

// Unread ones first (never pushed out of view by a burst of newer read ones), then newest first.
// `unreadCount` is counted in the database, so it stays right even with more unread than are listed.
export async function GET() {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    // If the owner changed this person's role or permissions, hand them a fresh sign-in token right now (no re-login)
    const sessionState = await refreshSessionIfStale(session);
    if (sessionState === 'gone') return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: session.id },
        orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
        take: 30,
      }),
      db.notification.count({ where: { userId: session.id, read: false } }),
    ]);

    return NextResponse.json({ notifications, unreadCount, sessionRefreshed: sessionState === 'refreshed' }, { status: 200 });
  } catch (error: any) {
    return serverError('Error fetching notifications', error);
  }
}

// Mark as read: the given ids, or (no ids) everything of this user's
export async function PUT(request: Request) {
  try {
    const session = await verifySession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const ids: string[] | null = Array.isArray(body?.ids) ? body.ids.filter((i: unknown) => typeof i === 'string').slice(0, 200) : null;

    await db.notification.updateMany({
      where: { userId: session.id, read: false, ...(ids ? { id: { in: ids } } : {}) },
      data: { read: true },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return serverError('Error updating notifications', error);
  }
}
