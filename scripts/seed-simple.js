// scripts/seed-simple.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function seedDatabase() {
  console.log('🌱 Заполнение базы данных тестовыми данными...');
  
  // Создаем директорию data если не существует
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const dbPath = path.join(dataDir, 'studentai.db');
  console.log('📁 Путь к базе данных:', dbPath);
  
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Включаем оптимизации
  await db.exec('PRAGMA journal_mode = WAL;');
  await db.exec('PRAGMA foreign_keys = ON;');

  try {
    await db.run('BEGIN TRANSACTION');

    // 1. СОЗДАЕМ ТАБЛИЦЫ ЕСЛИ ИХ НЕТ
    console.log('🗃️ Создаем таблицы...');
    
    // Таблица пользователей
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        phone TEXT PRIMARY KEY,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица групп
    await db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        university TEXT,
        admin_phone TEXT NOT NULL,
        max_members INTEGER DEFAULT 25,
        invite_link TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица участников групп
    await db.exec(`
      CREATE TABLE IF NOT EXISTS group_members (
        group_id INTEGER,
        user_phone TEXT,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, user_phone),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
      )
    `);

    // Таблица расписания - ВАЖНО: добавляем эту таблицу!
    await db.exec(`
      CREATE TABLE IF NOT EXISTS schedule_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        day TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        time_start TEXT NOT NULL,
        time_end TEXT NOT NULL,
        location TEXT,
        teacher TEXT,
        type TEXT DEFAULT 'lecture',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ Таблицы созданы/проверены');

    // 2. Создаем тестовых пользователей
    console.log('👥 Создаем пользователей...');
    await db.run(`INSERT OR IGNORE INTO users (phone, name) VALUES (?, ?)`, ['+79123456789', 'Тестовый Пользователь']);
    await db.run(`INSERT OR IGNORE INTO users (phone, name) VALUES (?, ?)`, ['+79001112233', 'Иван Петров']);
    await db.run(`INSERT OR IGNORE INTO users (phone, name) VALUES (?, ?)`, ['+79002223344', 'Мария Сидорова']);

    // 3. Создаем тестовую группу
    console.log('🎓 Создаем группу...');
    const groupResult = await db.run(
      `INSERT INTO groups (name, university, admin_phone, max_members, invite_link) 
       VALUES (?, ?, ?, ?, ?)`,
      ['ПИ-21-1', 'ХНУРЭ', '+79123456789', 25, 'http://localhost:3000/join/temp']
    );

    const groupId = groupResult.lastID;
    console.log('✅ Группа создана с ID:', groupId);

    // Обновляем invite_link с правильным ID
    await db.run(
      `UPDATE groups SET invite_link = ? WHERE id = ?`,
      [`http://localhost:3000/join/${groupId}`, groupId]
    );

    // 4. Добавляем пользователей в группу
    console.log('➕ Добавляем участников в группу...');
    await db.run(`INSERT OR IGNORE INTO group_members (group_id, user_phone) VALUES (?, ?)`, [groupId, '+79123456789']);
    await db.run(`INSERT OR IGNORE INTO group_members (group_id, user_phone) VALUES (?, ?)`, [groupId, '+79001112233']);
    await db.run(`INSERT OR IGNORE INTO group_members (group_id, user_phone) VALUES (?, ?)`, [groupId, '+79002223344']);

    // 5. Создаем тестовое расписание
    console.log('📅 Создаем расписание...');
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
        title: 'Программирование на Python',
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
      },
      {
        group_id: groupId,
        title: 'Базы данных',
        day: 'wednesday',
        time_slot: '13:40-15:10',
        time_start: '13:40',
        time_end: '15:10',
        location: 'Аудитория 201',
        teacher: 'Доц. Козлов',
        type: 'lecture'
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
    console.log('   - 1 группа (ID: ' + groupId + ')');
    console.log('   - 3 участника в группе');
    console.log('   - 4 занятия в расписании');

    // Показываем итоговую статистику
    const usersCount = await db.get('SELECT COUNT(*) as count FROM users');
    const groupsCount = await db.get('SELECT COUNT(*) as count FROM groups');
    const membersCount = await db.get('SELECT COUNT(*) as count FROM group_members');
    const eventsCount = await db.get('SELECT COUNT(*) as count FROM schedule_events');

    console.log('\n📈 Итоговая статистика базы данных:');
    console.log('   👥 Пользователи:', usersCount.count);
    console.log('   🎓 Группы:', groupsCount.count);
    console.log('   👤 Участники групп:', membersCount.count);
    console.log('   📅 Занятия:', eventsCount.count);

  } catch (error) {
    await db.run('ROLLBACK');
    console.error('❌ Ошибка заполнения базы данных:', error);
  } finally {
    await db.close();
    console.log('\n🔗 Подключение к базе данных закрыто');
  }
}

// Запускаем если файл выполняется напрямую
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };