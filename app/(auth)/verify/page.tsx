'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const phone = searchParams.get('phone');

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📱</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {error === 'Verification code sent' ? 'Код отправлен!' : 'Ошибка верификации'}
        </h2>
        
        {error === 'Verification code sent' ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Мы отправили SMS с кодом подтверждения на номер:
            </p>
            <p className="text-lg font-semibold text-blue-600">{phone || 'ваш номер'}</p>
            <p className="text-sm text-gray-500">
              Введите код в форме для завершения регистрации
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              {error === 'Configuration' && 'Ошибка конфигурации сервера'}
              {error === 'AccessDenied' && 'Доступ запрещен'}
              {error === 'Verification' && 'Неверный код подтверждения'}
              {!error && 'Произошла неизвестная ошибка'}
            </p>
            <p className="text-sm text-gray-500">
              Пожалуйста, попробуйте еще раз или обратитесь в поддержку
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Link
          href="/login"
          className="block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Вернуться к входу
        </Link>
        
        <Link
          href="/register"
          className="block w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Создать новую группу
        </Link>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Нужна помощь?</h3>
        <p className="text-sm text-gray-600">
          Если код не приходит, проверьте номер телефона или{' '}
          <a href="tel:+78001234567" className="text-blue-600 hover:text-blue-700">
            позвоните в поддержку
          </a>
        </p>
      </div>
    </div>
  );
}