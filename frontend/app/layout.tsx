import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { SessionProvider } from '@/context/SessionContext';
import { AppLayout } from '@/components/layout/AppLayout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DocuRAG — Multilingual AI Document Assistant',
  description:
    'Grounded multilingual question-answering system powered by Retrieval-Augmented Generation (RAG). Supports English, Hindi, and Hinglish with source citations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-50 dark:bg-neutral-950 font-sans text-neutral-900 dark:text-neutral-100">
        <ToastProvider>
          <SessionProvider>
            <AppLayout>{children}</AppLayout>
          </SessionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
