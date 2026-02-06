import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

// Создаем директорию для базы данных если не существует
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'studentai.db');

let db: Database | null = null;

export async function getDB() {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Включаем оптимизации для продакшена
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA synchronous = NORMAL;');
    await db.exec('PRAGMA cache_size = -64000;');
    await db.exec('PRAGMA busy_timeout = 5000;');
    await db.exec('PRAGMA foreign_keys = ON;');

    await initDB();
    console.log('✅ SQLite база данных инициализирована:', dbPath);
  }
  return db;
}

async function initDB() {
  const database = await getDB();
  
  // Создаем таблицы
  await database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      university TEXT,
      admin_phone TEXT NOT NULL,
      max_members INTEGER DEFAULT 25,
      invite_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (admin_phone) REFERENCES users(phone)
    );

  CREATE TABLE IF NOT EXISTS lecture_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id INTEGER,  -- Может быть NULL для личных конспектов
  schedule_event_id INTEGER,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  audio_transcript TEXT,
  slides_text TEXT,
  file_name TEXT,
  audio_url TEXT,     -- URL аудио файла
  image_urls TEXT,    -- JSON массив URL изображений
  image_count INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
  FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(phone)
);

CREATE INDEX IF NOT EXISTS idx_lecture_notes_group ON lecture_notes(group_id);
CREATE INDEX IF NOT EXISTS idx_lecture_notes_event ON lecture_notes(schedule_event_id);

    CREATE TABLE IF NOT EXISTS group_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      user_phone TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (user_phone) REFERENCES users(phone),
      UNIQUE(group_id, user_phone)
    );

    CREATE TABLE IF NOT EXISTS schedule_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      day TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      time_start TEXT,
      time_end TEXT,
      location TEXT,
      teacher TEXT,
      type TEXT NOT NULL,
      week_number INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    );

    -- ТАБЛИЦА ДЛЯ NextAuth - КОДЫ ВЕРИФИКАЦИИ
    CREATE TABLE IF NOT EXISTS verification_codes (
      phone TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_phone);
    CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_events_group ON schedule_events(group_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_events_day ON schedule_events(day);
    CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);
    CREATE INDEX IF NOT EXISTS idx_schedule_events_week ON schedule_events(week_number);
  `);

  await migrateToWeeks();
}
export async function migrateToWeeks() {
  try {
    const database = await getDB();
    
    console.log('🔄 Миграция для поддержки недель...');
    
    // 1. Добавляем колонку week_number если её нет
    const tableInfo = await database.all(`PRAGMA table_info(schedule_events)`);
    const hasWeekNumber = tableInfo.some(col => col.name === 'week_number');
    
    if (!hasWeekNumber) {
      console.log('📝 Добавляем колонку week_number...');
      await database.run(`ALTER TABLE schedule_events ADD COLUMN week_number INTEGER NOT NULL DEFAULT 1`);
      console.log('✅ Колонка week_number добавлена');
    }
    
    // 2. Создаем индекс если его нет
    const indexes = await database.all(`PRAGMA index_list(schedule_events)`);
    const hasWeekIndex = indexes.some(idx => idx.name === 'idx_schedule_events_week');
    
    if (!hasWeekIndex) {
      console.log('📝 Создаем индекс для week_number...');
      await database.run(`CREATE INDEX IF NOT EXISTS idx_schedule_events_week ON schedule_events(week_number)`);
      console.log('✅ Индекс создан');
    }
    
    console.log('✅ Миграция завершена');
    return true;
  } catch (error) {
    console.error('❌ Ошибка миграции:', error);
    return false;
  }
}
// Функция для миграции данных из in-memory хранилища
export async function migrateFromMemory() {
  const database = await getDB();
  
  // Здесь будет код миграции из shared-storage
  console.log('🔄 Миграция данных из in-memory хранилища...');
  
  // Пока просто логируем что миграция началась
  return true;
}

