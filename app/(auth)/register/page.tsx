'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'username' | 'code'>('phone');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setMessage('❌ Пожалуйста, введите номер телефона');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await signIn('credentials', {
        phone: phone.trim(),
        action: 'send_code',
        redirect: false,
      });

      if (result?.ok) {
        setStep('username');
        setMessage('✅ Код отправлен! Теперь придумайте никнейм');
        console.log('🔐 ДЕМО: Используйте код 123456 для регистрации');
      } else {
        setMessage('❌ Ошибка при отправке кода: ' + (result?.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Send code error:', error);
      setMessage('❌ Произошла ошибка при отправке кода');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setMessage('❌ Пожалуйста, придумайте никнейм');
      return;
    }

    if (username.length < 2) {
      setMessage('❌ Никнейм должен быть не менее 2 символов');
      return;
    }

    setStep('code');
    setMessage('✅ Теперь введите код подтверждения');
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setMessage('❌ Пожалуйста, введите код подтверждения');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await signIn('credentials', {
        phone: phone.trim(),
        code: code.trim(),
        username: username.trim(),
        action: 'verify_code',
        redirect: false,
      });

      if (result?.ok) {
        setMessage('✅ Регистрация успешна! Добро пожаловать!');
        
        // Даем время для установки сессии
        setTimeout(async () => {
          const session = await getSession();
          if (session) {
            console.log('🎓 Сессия создана:', session.user);
            router.push('/');
          } else {
            setMessage('❌ Ошибка создания сессии');
          }
        }, 1000);
      } else {
        setMessage('❌ Неверный код подтверждения');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setMessage('❌ Произошла ошибка при регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  const useDemoAccount = () => {
    setPhone('+79123456789');
    setUsername('Студент');
    setCode('123456');
    setMessage('🚀 Демо данные загружены. Нажмите "Получить код"');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        {step === 'phone' && 'Регистрация'}
        {step === 'username' && 'Придумайте никнейм'}
        {step === 'code' && 'Подтверждение номера'}
      </h2>

      {/* Демо кнопка */}
      {step === 'phone' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <button
            type="button"
            onClick={useDemoAccount}
            className="w-full text-yellow-800 hover:text-yellow-900 text-sm font-medium"
          >
            🚀 Загрузить демо данные
          </button>
        </div>
      )}

      {/* Сообщения */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('✅') || message.includes('🚀') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Шаг 1: Номер телефона */}
      {step === 'phone' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Номер телефона *
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+7 (912) 345-67-89"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Для входа в аккаунт и уведомлений
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !phone.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Отправка кода...
              </span>
            ) : (
              'Получить код'
            )}
          </button>
        </form>
      )}

      {/* Шаг 2: Никнейм */}
      {step === 'username' && (
        <form onSubmit={handleSetUsername} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Ваш никнейм *
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="pro100Petya"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Будет отображаться в вашем профиле
            </p>
          </div>

          <button
            type="submit"
            disabled={!username.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Продолжить
          </button>

          <button
            onClick={() => setStep('phone')}
            className="w-full text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Изменить номер телефона
          </button>
        </form>
      )}

      {/* Шаг 3: Код подтверждения */}
      {step === 'code' && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Код из SMS
            </label>
            <input
              id="code"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Введите 6-значный код, отправленный на {phone}
            </p>
            <p className="text-xs text-blue-600 mt-1 font-medium">
              💡 Для тестирования используйте код: <strong>123456</strong>
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2">Ваши данные:</h4>
            <p className="text-sm text-gray-600">Телефон: {phone}</p>
            <p className="text-sm text-gray-600">Никнейм: {username}</p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Регистрация...
              </span>
            ) : (
              'Зарегистрироваться'
            )}
          </button>

          <button
            onClick={() => setStep('username')}
            className="w-full text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Изменить никнейм
          </button>
        </form>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">🎓 EasyforStudent • HUSBP</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Создавайте AI-конспекты лекций</li>
          <li>• Присоединяйтесь к учебным группам</li>
          <li>• Смотрите расписание занятий</li>
        </ul>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600">
          Уже есть аккаунт?{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Войти
          </a>
        </p>
      </div>
    </div>
  );
}