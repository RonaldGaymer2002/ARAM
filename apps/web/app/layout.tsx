import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fundares Recycling Platform',
  description: 'Plataforma digital de gestión de reciclaje · Fundares',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <Providers>
          {children}
        </Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
