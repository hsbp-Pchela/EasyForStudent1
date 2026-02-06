// check-db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'studentai.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Проверяем базу данных...');

// 1. Конспекты
db.all('SELECT id, title, schedule_event_id FROM lecture_notes', (err, rows) => {
  if (err) {
    console.error('❌ Ошибка запроса конспектов:', err.message);
  } else {
    console.log('📚 Конспекты в базе:');
    rows.forEach(row => {
      console.log(`  ID: ${row.id}, Название: "${row.title}", Привязан к занятию: ${row.schedule_event_id || 'НЕТ'}`);
    });
  }
  
  // 2. Занятия
  db.all('SELECT id, title, day FROM schedule_events', (err, events) => {
    if (err) {
      console.error('❌ Ошибка запроса занятий:', err.message);
    } else {
      console.log('\n📅 Занятия в базе:');
      events.forEach(event => {
        console.log(`  ID: ${event.id}, Название: "${event.title}", День: ${event.day}`);
      });
    }
    
    // 3. Связи
    db.all(`
      SELECT ln.id as note_id, ln.title as note_title, 
             ln.schedule_event_id, se.title as event_title 
      FROM lecture_notes ln 
      LEFT JOIN schedule_events se ON ln.schedule_event_id = se.id
    `, (err, links) => {
      if (err) {
        console.error('❌ Ошибка запроса связей:', err.message);
      } else {
        console.log('\n🔗 Связи конспектов с занятиями:');
        links.forEach(link => {
          console.log(`  Конспект "${link.note_title}" (ID: ${link.note_id}) → ${link.event_title ? `Занятие "${link.event_title}"` : 'НЕ ПРИВЯЗАН'}`);
        });
      }
      
      db.close();
    });
  });
});