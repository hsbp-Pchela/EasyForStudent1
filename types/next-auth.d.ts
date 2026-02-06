import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    phone?: string;
    isPendingVerification?: boolean;
    groupName?: string | null;
    university?: string;
    isGroupAdmin?: boolean;
    groupId?: string | null; // ДОБАВЬТЕ ЭТО
    memberCount?: number; // ДОБАВЬТЕ ЭТО
  }

  interface Session {
    user: {
      phone?: string;
      isPendingVerification?: boolean;
      groupName?: string | null;
      university?: string;
      isGroupAdmin?: boolean;
      groupId?: string | null; // ДОБАВЬТЕ ЭТО
      memberCount?: number; // ДОБАВЬТЕ ЭТО
    } & DefaultSession['user'];
  }

  interface JWT {
    phone?: string;
    isPendingVerification?: boolean;
    groupName?: string | null;
    university?: string;
    isGroupAdmin?: boolean;
    groupId?: string | null; // ДОБАВЬТЕ ЭТО
    memberCount?: number; // ДОБАВЬТЕ ЭТО
  }
}