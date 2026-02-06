import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

// Моковая функция для отправки SMS
async function sendVerificationCode(phone: string, code: string) {
  console.log(`SMS код для ${phone}: ${code}`);
  // В реальном приложении здесь будет интеграция с SMS-сервисом
  return true;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'SMS',
      credentials: {
        phone: { label: 'Phone', type: 'text', placeholder: '+79123456789' },
        code: { label: 'Verification Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone) {
          return null;
        }

        // Если код не предоставлен, отправляем SMS
        if (!credentials.code) {
          const verificationCode = '123456'; // В реальном приложении генерируйте случайный код
          await sendVerificationCode(credentials.phone, verificationCode);
          throw new Error('Verification code sent');
        }

        // Если код предоставлен, проверяем его (временная логика)
        if (credentials.code === '123456') {
          return {
            id: credentials.phone,
            phone: credentials.phone,
            name: `User_${credentials.phone}`,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/verify',
  },
})