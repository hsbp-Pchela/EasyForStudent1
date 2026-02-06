'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const result = await signIn('credentials', {
        phone: phone.trim(),
        action: 'send_code',
        redirect: false,
      });

      if (result?.ok) {
        setStep('code');
        setMessage('✅ Код отправлен! Используйте 123456 для входа');
        console.log('🔐 ДЕМО: Используйте код 123456 для входа');
      } else {
        setMessage('❌ Ошибка при отправке кода');
      }
    } catch (error) {
      console.error('Send code error:', error);
      setMessage('❌ Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setMessage('');

    try {
      const result = await signIn('credentials', {
        phone: phone.trim(),
        code: code.trim(),
        action: 'verify_code',
        redirect: false,
      });

      if (result?.ok) {
        setMessage('✅ Успешный вход!');
        
        // Даем время для установки сессии
        setTimeout(async () => {
          const session = await getSession();
          if (session) {
            router.push('/');
          } else {
            setMessage('❌ Ошибка сессии');
          }
        }, 1000);
      } else {
        setMessage('❌ Неверный код подтверждения');
      }
    } catch (error) {
      console.error('Verify code error:', error);
      setMessage('❌ Произошла ошибка при проверке кода');
    } finally {
      setIsLoading(false);
    }
  };

  const useDemoAccount = () => {
    setPhone('+79123456789');
    setCode('123456');
    setMessage('🚀 Демо данные загружены. Нажмите "Получить код"');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        {step === 'phone' ? 'Вход в аккаунт' : 'Подтверждение кода'}
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

      {step === 'phone' ? (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Номер телефона
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="+7 (912) 345-67-89"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Мы отправим SMS с кодом подтверждения
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
      ) : (
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

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Проверка...
              </span>
            ) : (
              'Войти'
            )}
          </button>
        </form>
      )}

      {step === 'code' && (
        <button
          onClick={() => {
            setStep('phone');
            setMessage('');
          }}
          className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm"
        >
          ← Изменить номер телефона
        </button>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-center text-sm text-gray-600">
          Еще нет группы?{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
            Создать новую группу
          </a>
        </p>
      </div>
    </div>
  );
}