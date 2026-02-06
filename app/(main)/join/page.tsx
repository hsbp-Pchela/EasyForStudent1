'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default function JoinGroupPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [groupInfo, setGroupInfo] = useState<any>(null);
  const [message, setMessage] = useState('');

  // Автозаполнение из URL параметра
  useEffect(() => {
    const groupParam = searchParams.get('group');
    if (groupParam) {
      setInviteCode(groupParam);
    }
  }, [searchParams]);

  const checkInviteLink = async () => {
    if (!inviteCode.trim()) {
      setMessage('❌ Введите код приглашения');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/groups/join/${inviteCode.trim()}`);
      
      if (response.ok) {
        const data = await response.json();
        setGroupInfo(data.group);
        setMessage(`✅ Найдена группа: "${data.group.name}"`);
      } else {
        const errorData = await response.json();
        setMessage(`❌ ${errorData.error || 'Группа не найдена'}`);
        setGroupInfo(null);
      }
    } catch (error) {
      console.error('Ошибка проверки ссылки:', error);
      setMessage('❌ Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  const joinGroup = async () => {
    if (!groupInfo) return;

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          groupId: groupInfo.id,
          groupName: groupInfo.name
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage('✅ Вы успешно присоединились к группе!');
        
        // Перенаправляем на расписание через 2 секунды
        setTimeout(() => {
          router.push('/schedule');
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage(`❌ ${errorData.error || 'Ошибка присоединения'}`);
      }
    } catch (error) {
      console.error('Ошибка присоединения:', error);
      setMessage('❌ Ошибка соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="py-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">🔒 Необходима авторизация</h1>
              <p className="text-gray-600 mb-6">Пожалуйста, войдите в систему чтобы присоединиться к группе</p>
              <a
                href="/login"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block"
              >
                Войти в систему
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navigation />
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🔗 Присоединиться к группе
            </h1>
            <p className="text-lg text-gray-600">
              Введите код приглашения от администратора группы
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            {/* Форма ввода кода */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Код приглашения *
              </label>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="group_1234567890"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={checkInviteLink}
                  disabled={isLoading || !inviteCode.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400"
                >
                  {isLoading ? 'Проверка...' : 'Проверить'}
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Попросите код приглашения у администратора вашей группы
              </p>
            </div>

            {/* Сообщения */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.includes('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            {/* Информация о группе */}
            {groupInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-blue-800 mb-3 text-lg">
                  🎓 Информация о группе
                </h3>
                <div className="space-y-2 text-blue-700">
                  <p><strong>Название:</strong> {groupInfo.name}</p>
                  {groupInfo.university && (
                    <p><strong>Учебное заведение:</strong> {groupInfo.university}</p>
                  )}
                  <p><strong>Участников:</strong> {groupInfo.memberCount}/{groupInfo.maxMembers}</p>
                  <p><strong>Администратор:</strong> {groupInfo.adminPhone}</p>
                </div>

                <button
                  onClick={joinGroup}
                  disabled={isLoading}
                  className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-green-400"
                >
                  {isLoading ? 'Присоединение...' : '✅ Присоединиться к группе'}
                </button>
              </div>
            )}

            {/* Инструкция */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <h3 className="font-semibold text-yellow-800 mb-3">💡 Как это работает?</h3>
              <ul className="text-yellow-700 space-y-2 text-sm">
                <li>1. Попросите у администратора группы ссылку для приглашения</li>
                <li>2. Скопируйте код из ссылки (часть после /join/)</li>
                <li>3. Вставьте код в поле выше и нажмите "Проверить"</li>
                <li>4. После проверки нажмите "Присоединиться к группе"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}