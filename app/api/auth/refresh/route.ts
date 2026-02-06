// app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { getDB } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.phone) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const db = await getDB();

    // Находим актуальные данные пользователя из базы
    const userGroup = await db.get(
      `SELECT g.*, 
              COUNT(gm.user_phone) as member_count,
              CASE WHEN g.admin_phone = ? THEN 1 ELSE 0 END as is_admin
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_phone = ?
       GROUP BY g.id`,
      [session.user.phone, session.user.phone]
    );

    return NextResponse.json({
      user: {
        phone: session.user.phone,
        groupId: userGroup?.id?.toString() || null,
        groupName: userGroup?.name || null,
        university: userGroup?.university || '',
        isGroupAdmin: Boolean(userGroup?.is_admin),
        memberCount: userGroup?.member_count || 0
      }
    });

  } catch (error) {
    console.error('❌ Ошибка обновления сессии:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}