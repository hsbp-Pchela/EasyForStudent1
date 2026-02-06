// scripts/recreate-lecture-notes.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

// Пути
const rootDir = process.cwd();
const dbDir = path.join(rootDir, 'data');
const dbPath = path.join(dbDir, 'studentai.db');
const backupPath = path.join(dbDir, 'lecture_notes_backup.json');

async function recreateTable() {
  console.log('🔄 Начинаем пересоздание таблицы lecture_notes...');
  console.log(`📁 Путь к базе: ${dbPath}`);
  
  // Создаем директорию если нет
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  let db;
  
  try {
    // Открываем базу данных
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Включаем foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');
    
    // 1. Проверяем существование таблицы
    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='lecture_notes'"
    );
    
    if (!tableExists) {
      console.log('❌ Таблица lecture_notes не существует, создаем новую...');
      await createNewTable(db);
      return;
    }
    
    // 2. Создаем резервную копию существующих данных
    console.log('📋 Создаем резервную копию данных...');
    const oldNotes = await db.all('SELECT * FROM lecture_notes');
    
    fs.writeFileSync(backupPath, JSON.stringify(oldNotes, null, 2));
    console.log(`✅ Резервная копия создана: ${backupPath} (${oldNotes.length} записей)`);
    
    // 3. Проверяем структуру текущей таблицы
    console.log('\n📊 Текущая структура таблицы:');
    const oldColumns = await db.all('PRAGMA table_info(lecture_notes)');
    oldColumns.forEach(col => {
      console.log(`  ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : 'NULL'}`);
    });
    
    // 4. Переименовываем старую таблицу
    console.log('\n📝 Переименовываем старую таблицу...');
    await db.run('ALTER TABLE lecture_notes RENAME TO lecture_notes_old');
    console.log('✅ Старая таблица переименована в lecture_notes_old');
    
    // 5. Создаем новую таблицу с правильной структурой
    console.log('🆕 Создаем новую таблицу...');
    await createNewTable(db);
    
    // 6. Восстанавливаем данные (без новых полей)
    if (oldNotes.length > 0) {
      console.log(`\n🔄 Восстанавливаем ${oldNotes.length} записей...`);
      
      // Определяем какие колонки есть в старой таблице
      const oldColumnNames = oldColumns.map(c => c.name);
      
      for (const note of oldNotes) {
        // Собираем только существующие поля
        const fields = ['id', 'group_id', 'schedule_event_id', 'title', 'content', 
                       'audio_transcript', 'slides_text', 'file_name', 'image_count', 
                       'created_by', 'created_at'];
        
        const values = fields
          .filter(field => oldColumnNames.includes(field))
          .map(field => note[field]);
        
        const placeholders = values.map(() => '?').join(', ');
        const fieldNames = fields.filter(field => oldColumnNames.includes(field)).join(', ');
        
        await db.run(
          `INSERT INTO lecture_notes (${fieldNames}) VALUES (${placeholders})`,
          values
        );
      }
      console.log(`✅ Данные восстановлены (${oldNotes.length} записей)`);
    }
    
    // 7. Проверяем новую структуру
    console.log('\n📊 Новая структура таблицы:');
    const newColumns = await db.all('PRAGMA table_info(lecture_notes)');
    newColumns.forEach(col => {
      console.log(`  ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : 'NULL'}`);
    });
    
    console.log('\n🎉 Пересоздание таблицы успешно завершено!');
    console.log('💡 Старая таблица сохранена как lecture_notes_old');
    console.log('💡 Резервная копия данных: data/lecture_notes_backup.json');
    
  } catch (error) {
    console.error('❌ Ошибка при пересоздании таблицы:', error);
    
    // Пытаемся восстановить оригинальную таблицу в случае ошибки
    try {
      if (db) {
        console.log('🔄 Пытаемся восстановить оригинальную таблицу...');
        
        // Удаляем новую таблицу если она была создана
        await db.run('DROP TABLE IF EXISTS lecture_notes');
        
        // Восстанавливаем старую
        const oldTableExists = await db.get(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='lecture_notes_old'"
        );
        
        if (oldTableExists) {
          await db.run('ALTER TABLE lecture_notes_old RENAME TO lecture_notes');
          console.log('✅ Оригинальная таблица восстановлена');
        }
      }
    } catch (rollbackError) {
      console.error('❌ Ошибка восстановления:', rollbackError);
    }
  } finally {
    if (db) {
      await db.close();
    }
  }
}

async function createNewTable(db) {
  await db.exec(`
    CREATE TABLE lecture_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      schedule_event_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      audio_transcript TEXT,
      slides_text TEXT,
      file_name TEXT,
      audio_url TEXT,
      image_urls TEXT,
      image_count INTEGER DEFAULT 0,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL,
      FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(phone)
    )
  `);
  
  // Создаем индексы с IF NOT EXISTS
  await db.exec('CREATE INDEX IF NOT EXISTS idx_lecture_notes_group ON lecture_notes(group_id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_lecture_notes_event ON lecture_notes(schedule_event_id)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_lecture_notes_created_by ON lecture_notes(created_by)');
  await db.exec('CREATE INDEX IF NOT EXISTS idx_lecture_notes_created_at ON lecture_notes(created_at)');
  
  console.log('✅ Новая таблица создана с правильной структурой');
  console.log('✅ Индексы созданы');
}

recreateTable();