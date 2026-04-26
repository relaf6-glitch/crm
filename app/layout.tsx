import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'CRM | ניהול לקוחות',
  description: 'מערכת ניהול לקוחות ומשימות מקצועית',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className={`${heebo.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="bottom-left"
            richColors
            closeButton
            dir="rtl"
            toastOptions={{
              style: { fontFamily: 'Heebo, sans-serif' },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
