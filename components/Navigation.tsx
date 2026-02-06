// components/Navigation.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          {/* Левая часть - лого и основные ссылки */}
          <div className="flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-xl font-bold hover:text-blue-200 transition-colors flex items-center space-x-2"
            >
              <span>🎓</span>
              <span>Конспект</span>
            </Link>
            
            {/* Ссылки показываются только для авторизованных пользователей */}
            {session && (
              <div className="flex items-center space-x-6">
                <Link 
                  href="/schedule" 
                  className={`hover:text-blue-200 transition-colors ${
                    pathname === '/schedule' ? 'text-blue-200 font-semibold' : ''
                  }`}
                >
                  📅 Расписание
                </Link>
                <Link 
                  href="/lecture-notes" 
                  className={`hover:text-blue-200 transition-colors ${
                    pathname === '/lecture-notes' ? 'text-blue-200 font-semibold' : ''
                  }`}
                >
                  📚 Конспекты
                </Link>
                <Link 
                  href="/groups" 
                  className={`hover:text-blue-200 transition-colors ${
                    pathname === '/groups' ? 'text-blue-200 font-semibold' : ''
                  }`}
                >
                  👥 Группы
                </Link>
              </div>
            )}
          </div>

          {/* Правая часть - пользователь и кнопки */}
          <div className="flex items-center space-x-4">
            {status === 'loading' && (
              <span className="text-sm">Загрузка...</span>
            )}
            
            {session ? (
              <div className="flex items-center space-x-4">
                {/* Информация о пользователе */}
                <div className="text-right">
                  <p className="text-sm font-medium">{session.user?.phone}</p>
                  {session.user?.groupName && (
                    <p className="text-xs text-blue-200">
                      {session.user.groupName}
                      {session.user.isGroupAdmin && ' 👑'}
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={() => signOut()}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
                >
                  Выйти
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors font-medium"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}