const fs = require('fs');
const path = require('path');

function backupDatabase() {
  const dbPath = path.join(__dirname, '..', 'data', 'studentai.db');
  const backupDir = path.join(__dirname, '..', 'backups');

  // Создаем директорию для бэкапов если не существует
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}.db`);

  // Проверяем что исходный файл существует
  if (!fs.existsSync(dbPath)) {
    console.log('❌ Файл базы данных не найден:', dbPath);
    return;
  }

  // Копируем файл базы данных
  fs.copyFileSync(dbPath, backupPath);

  console.log(`✅ Бэкап создан: ${backupPath}`);
}

backupDatabase();