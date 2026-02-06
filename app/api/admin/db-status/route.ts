import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/database';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    
    // Получаем статистику базы данных
    const tables = await db.all(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    
    const stats: Record<string, number> = {};
    
    for (const table of tables) {
      const count = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
      stats[table.name] = count.count;
    }
    
    // Размер файла базы данных
    const dbPath = path.join(process.cwd(), 'data', 'studentai.db');
    const fileStats = fs.existsSync(dbPath) ? fs.statSync(dbPath) : null;
    
    // Исправленный reduce с правильными типами
    const totalRecords = Object.values(stats).reduce(
      (a: number, b: number) => a + b, 
      0
    );
    
    return NextResponse.json({
      status: 'ok',
      database: {
        path: dbPath,
        size: fileStats ? `${(fileStats.size / 1024 / 1024).toFixed(2)} MB` : 'Not found',
        tables: stats,
        totalRecords: totalRecords
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Ошибка получения статуса БД:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}