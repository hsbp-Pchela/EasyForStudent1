'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navigation from '@/components/Navigation';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    console.log('MainLayout mounted');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main>{children}</main>
    </div>
  );
}