// app/api/auth/force-refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 });
    }

    const db = await getDB();

    // Находим актуальные данные пользователя
    const userGroup = await db.get(
      `SELECT g.*, 
              COUNT(gm.user_phone) as member_count,
              CASE WHEN g.admin_phone = ? THEN 1 ELSE 0 END as is_admin
       FROM groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_phone = ?
       GROUP BY g.id`,
      [phone, phone]
    );

    console.log('🔄 Force Refresh: Найдена группа для', phone, ':', userGroup);

    // Возвращаем данные для создания нового JWT
    return NextResponse.json({ 
      success: true,
      user: {
        id: phone,
        phone: phone,
        name: `User_${phone}`,
        groupName: userGroup?.name || null,
        university: userGroup?.university || '',
        isGroupAdmin: Boolean(userGroup?.is_admin),
        groupId: userGroup?.id?.toString() || null,
        memberCount: userGroup?.member_count || 0
      }
    });

  } catch (error) {
    console.error('Ошибка force refresh:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}