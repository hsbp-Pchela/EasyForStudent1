'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/Navigation';

interface DBStatus {
  status: string;
  database: {
    path: string;
    size: string;
    tables: Record<string, number>;
    totalRecords: number;
  };
  timestamp: string;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDbStatus();
  }, []);

  const loadDbStatus = async () => {
    try {
      const response = await fetch('/api/admin/db-status');
      if (response.ok) {
        const data = await response.json();
        setDbStatus(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки статуса БД:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем права доступа (можно настроить по необходимости)
  if (!session?.user?.phone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">🔒 Доступ запрещен</h1>
            <p className="text-gray-600">Необходима авторизация</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">⚙️ Панель администратора</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Статус базы данных */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">📊 Статус базы данных</h2>
              
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Загрузка...</p>
                </div>
              ) : dbStatus ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Статус:</span>
                    <span className="text-green-600 font-semibold">{dbStatus.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Размер:</span>
                    <span>{dbStatus.database.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Всего записей:</span>
                    <span className="font-semibold">{dbStatus.database.totalRecords}</span>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Таблицы:</h3>
                    <div className="space-y-2">
                      {Object.entries(dbStatus.database.tables).map(([table, count]) => (
                        <div key={table} className="flex justify-between text-sm">
                          <span className="text-gray-600">{table}:</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={loadDbStatus}
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Обновить
                  </button>
                </div>
              ) : (
                <p className="text-red-600">Ошибка загрузки статуса</p>
              )}
            </div>

            {/* Быстрые действия */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">🚀 Быстрые действия</h2>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.open('/api/admin/db-status', '_blank')}
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  📊 JSON статус БД
                </button>
                
                <button
                  onClick={() => {
                    // Можно добавить функционал резервного копирования
                    alert('Функция в разработке');
                  }}
                  className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  💾 Создать бэкап
                </button>
                
                <a
                  href="/data/studentai.db"
                  download
                  className="block w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-center"
                >
                  📥 Скачать базу данных
                </a>
              </div>
            </div>
          </div>

          {/* Инструкция по работе с БД */}
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">📖 Инструкция по управлению БД</h2>
            
            <div className="space-y-3 text-sm text-gray-700">
              <p><strong>1. Установите DB Browser for SQLite:</strong> https://sqlitebrowser.org/</p>
              <p><strong>2. Откройте файл базы данных:</strong> <code>data/studentai.db</code></p>
              <p><strong>3. Для просмотра данных:</strong> перейдите на вкладку "Данные просмотра"</p>
              <p><strong>4. Для выполнения SQL запросов:</strong> перейдите на вкладку "Выполнить SQL"</p>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Полезные SQL запросы:</h3>
                <pre className="text-xs bg-black text-green-400 p-2 rounded overflow-x-auto">
{`-- Все группы с количеством участников
SELECT g.*, COUNT(gm.user_phone) as member_count 
FROM groups g 
LEFT JOIN group_members gm ON g.id = gm.group_id 
GROUP BY g.id;

-- Все пользователи
SELECT * FROM users;

-- Расписание конкретной группы
SELECT * FROM schedule_events WHERE group_id = 1;`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}