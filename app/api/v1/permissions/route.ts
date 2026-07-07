import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';

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
    const permissions = await db.staffPermission.findMany({
      where: { userId },
    });
    return NextResponse.json({ permissions });
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

    // Wrap in transaction for ACID safety
    await db.$transaction(async (tx: any) => {
      // Clear existing permissions for this user
      await tx.staffPermission.deleteMany({
        where: { userId }
      });

      // Insert new permissions
      if (permissions.length > 0) {
        await tx.staffPermission.createMany({
          data: permissions.map((p: any) => ({
            userId,
            pageKey: p.pageKey,
            canView: p.canView,
            canAdd: p.canAdd,
            canEdit: p.canEdit,
            canDelete: p.canDelete
          }))
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Permission save error:', error);
    return NextResponse.json({ error: 'Failed to save permissions' }, { status: 500 });
  }
}
