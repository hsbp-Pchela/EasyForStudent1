// app/main/groups/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import TransferAdminModal from '@/components/TransferAdminModal';

interface Group {
  id: string;
  name: string;
  university: string;
  admin: string;
  memberCount: number;
  maxMembers: number;
  isAdmin: boolean;
  inviteLink: string;
  members: string[];
}

export default function GroupsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    groupName: '',
    university: '',
  });
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserGroup();
  }, [session]);

  const loadUserGroup = async () => {
    try {
      console.log('🔄 Loading user group...');
      const response = await fetch('/api/groups');
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Groups API response:', data);
        setUserGroup(data.userGroup || null);
      } else {
        console.error('❌ Error loading group:', response.status);
      }
    } catch (error) {
      console.error('Ошибка загрузки группы:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionData = async () => {
    try {
      // Обновляем данные сессии через API
      const response = await fetch('/api/update-session', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        
        // Обновляем сессию NextAuth
        await update({
          ...session,
          user: {
            ...session?.user,
            ...data.updatedUserData
          }
        });
        
        console.log('✅ Сессия обновлена:', data.updatedUserData);
      }
    } catch (error) {
      console.error('❌ Ошибка обновления сессии:', error);
    }
  };

  const createGroup = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!newGroup.groupName.trim()) {
    alert('Введите название группы');
    return;
  }

  try {
    const response = await fetch('/api/groups', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newGroup.groupName.trim(),
        university: newGroup.university.trim(),
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Группа создана, обновляем сессию:', data.userGroup);
      
      // ОБНОВЛЯЕМ СЕССИЮ СРАЗУ С ДАННЫМИ ИЗ RESPONSE
      await update({
        ...session,
        user: {
          ...session?.user,
          groupId: data.userGroup.id.toString(),
          groupName: data.userGroup.name,
          university: data.userGroup.university,
          isGroupAdmin: data.userGroup.isAdmin,
          memberCount: data.userGroup.memberCount
        }
      });

      alert('✅ Группа создана!');
      setIsCreating(false);
      setNewGroup({ groupName: '', university: '' });
      
      // Перезагружаем данные группы
      await loadUserGroup();
      
    } else {
      alert(`❌ ${data.error}`);
    }
  } catch (error) {
    console.error('Ошибка создания группы:', error);
    alert('Ошибка соединения с сервером');
  }
};

  // app/main/groups/page.tsx - замените функцию deleteGroup на:
const deleteGroup = async () => {
  if (!confirm('Вы уверены что хотите удалить группу? Это действие нельзя отменить.')) {
    return;
  }

  setLoading(true);
  
  try {
    const response = await fetch('/api/groups/delete', {
      method: 'POST',
    });

    if (response.ok) {
      console.log('🗑️ Группа удалена');
      
      // ОБНОВЛЯЕМ СЕССИЮ NextAuth
      await update(); // Это вызовет JWT callback который обновит данные
      
      // Даем время на обновление сессии
      setTimeout(() => {
        alert('✅ Группа удалена!');
        window.location.href = '/'; // Переходим на главную
      }, 500);
      
    } else {
      const error = await response.json();
      alert(`❌ ${error.error}`);
    }
  } catch (error) {
    console.error('Ошибка удаления группы:', error);
    alert('Ошибка соединения');
  } finally {
    setLoading(false);
  }
};

  const leaveGroup = async () => {
    if (!confirm('🚪 Вы уверены что хотите выйти из группы?')) {
      return;
    }

    try {
      const response = await fetch('/api/groups/leave', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ ' + data.message);
        // Обновляем сессию
        await updateSessionData();
        // Перезагружаем страницу для полного сброса состояния
        window.location.href = '/';
      } else {
        alert('❌ ' + data.error);
      }
    } catch (error) {
      console.error('Ошибка выхода из группы:', error);
      alert('❌ Ошибка соединения с сервером');
    }
  };

  const copyInviteLink = async () => {
    if (!userGroup?.inviteLink) return;
    
    try {
      await navigator.clipboard.writeText(userGroup.inviteLink);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = userGroup.inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    }
  };

  const getGroupMembers = (): string[] => {
    if (!userGroup?.members) {
      return [session?.user?.phone || ''];
    }
    return userGroup.members;
  };

  // Отладочная информация
  console.log('🔍 Groups Page Debug:', {
    session: session,
    userGroup: userGroup,
    hasGroup: !!userGroup,
    groupId: userGroup?.id,
    sessionGroupId: session?.user?.groupId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎓 Управление группой
            </h1>
            <p className="text-lg text-gray-600">
              {userGroup ? `Группа: ${userGroup.name}` : 'Создайте группу и пригласите одногруппников'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Group ID: {session?.user?.groupId || 'null'}
            </p>
          </div>

          {userGroup ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {userGroup.name}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>🏫 {userGroup.university || 'Не указано'}</span>
                    <span>👥 {userGroup.memberCount}/{userGroup.maxMembers} участников</span>
                    {userGroup.isAdmin && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        👑 Администратор
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Кнопки управления группой */}
                <div className="flex space-x-3">
                  {userGroup.isAdmin && (
                    <button
                      onClick={() => setShowTransferModal(true)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors font-medium text-sm"
                    >
                      👑 Передать админку
                    </button>
                  )}
                  
                  {/* Кнопка выхода/удаления */}
                  {userGroup.isAdmin ? (
                    <button
                      onClick={deleteGroup}
                      disabled={loading}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Удаление...' : '🗑️ Удалить группу'}
                    </button>
                  ) : (
                    <button
                      onClick={leaveGroup}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm"
                    >
                      🚪 Выйти из группы
                    </button>
                  )}
                </div>
              </div>

              {userGroup.isAdmin && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-3 text-lg">
                    🔗 Ссылка для приглашения
                  </h3>
                  <p className="text-blue-700 mb-4 text-sm">
                    Отправьте эту ссылку одногруппникам для вступления в группу
                  </p>
                  
                  <div className="flex space-x-3">
                    <div className="flex-1 bg-white border border-blue-300 rounded-lg p-3 text-sm text-gray-700 break-all">
                      {userGroup.inviteLink || `http://localhost:3000/join?group=${userGroup.id}`}
                    </div>
                    <button
                      onClick={copyInviteLink}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                    >
                      {inviteCopied ? '✅ Скопировано!' : '📋 Копировать'}
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-4 text-lg">
                  👥 Участники группы ({userGroup.memberCount})
                </h3>
                <div className="space-y-3">
                  {getGroupMembers().map((member, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">
                          {member === session?.user?.phone ? '👑' : '👤'}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member === session?.user?.phone ? 'Вы' : `Участник ${index + 1}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member}
                          </p>
                        </div>
                      </div>
                      {member === session?.user?.phone && userGroup.isAdmin && (
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                          Админ
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isCreating ? 'Создание новой группы' : 'У вас еще нет группы'}
                </h2>
                {!isCreating && (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    🎓 Создать группу
                  </button>
                )}
              </div>

              {isCreating && (
                <form onSubmit={createGroup} className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h3 className="font-semibold text-blue-800 mb-4 text-lg">Создание новой учебной группы</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Название группы *
                      </label>
                      <input
                        type="text"
                        placeholder="ПИ-21-1, БИ-20-2"
                        value={newGroup.groupName}
                        onChange={(e) => setNewGroup({...newGroup, groupName: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Учебное заведение
                      </label>
                      <input
                        type="text"
                        placeholder="ХНУ, ХНУРЭ"
                        value={newGroup.university}
                        onChange={(e) => setNewGroup({...newGroup, university: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      🎓 Создать группу
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setNewGroup({ groupName: '', university: '' });
                      }}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              )}

              {!isCreating && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                  <h3 className="font-semibold text-yellow-800 mb-3">💡 Как это работает?</h3>
                  <ul className="text-yellow-700 space-y-2 text-sm">
                    <li>• Создайте группу для вашего учебного потока</li>
                    <li>• После создания получите ссылку для приглашения</li>
                    <li>• Отправьте ссылку одногруппникам</li>
                    <li>• Управляйте расписанием и конспектами вместе</li>
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="text-center text-gray-500 text-sm">
            <p>🎓 Каждая группа - это отдельное учебное пространство с общим расписанием и AI-конспектами</p>
          </div>
        </div>
      </div>

      {userGroup?.isAdmin && (
        <TransferAdminModal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          groupId={userGroup.id}
          currentMembers={getGroupMembers()}
          currentUserPhone={session?.user?.phone || ''}
        />
      )}
    </div>
  );
}