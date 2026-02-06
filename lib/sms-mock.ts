// Временное хранилище для кодов подтверждения (в продакшене используйте Redis или БД)
const verificationCodes = new Map<string, { code: string; expires: number }>();

// Генерация случайного 6-значного кода
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Сохранение кода с временем жизни (10 минут)
export function saveVerificationCode(phone: string): string {
  const code = generateVerificationCode();
  const expires = Date.now() + 10 * 60 * 1000; // 10 минут
  
  verificationCodes.set(phone, { code, expires });
  
  // Автоочистка устаревших кодов
  setTimeout(() => {
    verificationCodes.delete(phone);
  }, 10 * 60 * 1000);
  
  return code;
}

// Проверка кода
export function verifyCode(phone: string, code: string): boolean {
  const stored = verificationCodes.get(phone);
  
  if (!stored) {
    return false;
  }
  
  // Проверяем срок действия
  if (Date.now() > stored.expires) {
    verificationCodes.delete(phone);
    return false;
  }
  
  // Проверяем код
  if (stored.code === code) {
    verificationCodes.delete(phone); // Удаляем использованный код
    return true;
  }
  
  return false;
}

// Моковая отправка SMS
export async function sendVerificationCode(phone: string, code: string): Promise<boolean> {
  console.log(`📱 SMS код для ${phone}: ${code}`);
  console.log(`💡 Для тестирования используйте код: ${code}`);
  
  // В реальном приложении здесь будет интеграция с SMS-сервисом
  // Например, с Twilio, MessageBird, или российскими провайдерами
  
  return true;
}