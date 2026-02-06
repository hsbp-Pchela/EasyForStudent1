import { getDB } from '@/lib/database';

async function seedDatabase() {
  console.log('🌱 Заполнение базы данных тестовыми данными...');
  
  const db = await getDB();

  try {
    await db.run('BEGIN TRANSACTION');

    // Создаем тестовых пользователей
    await db.run(
      `INSERT OR IGNORE INTO users (phone, name) VALUES (?, ?)`,
      ['+79123456789', 'Тестовый Пользователь']
    );
    
    await db.run(
      `INSERT OR IGNORE INTO users (phone, name) VALUES (?, ?)`,
      ['+79001112233', 'Иван Петров']
    );

    await db.run(
      `INSERT OR IGNORE INTO users (phone, name) VALUES (?, ?)`,
      ['+79002223344', 'Мария Сидорова']
    );

    // Создаем тестовую группу
    const groupResult = await db.run(
      `INSERT INTO groups (name, university, admin_phone, invite_link) 
       VALUES (?, ?, ?, ?)`,
      ['ПИ-21-1', 'ХНУ', '+79123456789', 'http://localhost:3000/join/1']
    );

    const groupId = groupResult.lastID;

    // Обновляем invite_link с правильным ID
    await db.run(
      `UPDATE groups SET invite_link = ? WHERE id = ?`,
      [`http://localhost:3000/join/${groupId}`, groupId]
    );

    // Добавляем пользователей в группу
    await db.run(
      `INSERT INTO group_members (group_id, user_phone) VALUES (?, ?)`,
      [groupId, '+79123456789']
    );

    await db.run(
      `INSERT INTO group_members (group_id, user_phone) VALUES (?, ?)`,
      [groupId, '+79001112233']
    );

    await db.run(
      `INSERT INTO group_members (group_id, user_phone) VALUES (?, ?)`,
      [groupId, '+79002223344']
    );

    // Создаем тестовое расписание
    const scheduleEvents = [
      {
        group_id: groupId,
        title: 'Математический анализ',
        day: 'monday',
        time_slot: '8:30-10:00',
        time_start: '8:30',
        time_end: '10:00',
        location: 'Аудитория 101',
        teacher: 'Проф. Иванов',
        type: 'lecture'
      },
      {
        group_id: groupId,
        title: 'Программирование',
        day: 'monday', 
        time_slot: '10:10-11:40',
        time_start: '10:10',
        time_end: '11:40',
        location: 'Компьютерный класс 205',
        teacher: 'Доц. Петрова',
        type: 'practice'
      },
      {
        group_id: groupId,
        title: 'Физика',
        day: 'tuesday',
        time_slot: '11:50-13:20',
        time_start: '11:50',
        time_end: '13:20', 
        location: 'Лаборатория 305',
        teacher: 'Проф. Сидоров',
        type: 'lab'
      }
    ];

    for (const event of scheduleEvents) {
      await db.run(
        `INSERT INTO schedule_events 
         (group_id, title, day, time_slot, time_start, time_end, location, teacher, type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [event.group_id, event.title, event.day, event.time_slot, 
         event.time_start, event.time_end, event.location, event.teacher, event.type]
      );
    }

    await db.run('COMMIT');
    
    console.log('✅ Тестовые данные успешно добавлены!');
    console.log('📊 Создано:');
    console.log('   - 3 пользователя');
    console.log('   - 1 группа');
    console.log('   - 3 занятия в расписании');

  } catch (error) {
    await db.run('ROLLBACK');
    console.error('❌ Ошибка заполнения базы данных:', error);
    throw error;
  }
}

// Запускаем заполнение если файл запущен напрямую
if (require.main === module) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };