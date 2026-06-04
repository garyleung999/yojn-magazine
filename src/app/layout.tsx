import type { Metadata } from 'next'
import { Noto_Sans_TC, Noto_Serif_TC } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/context/AuthContext'
import { AuthErrorBanner } from '@/components/AuthErrorBanner'
import FeedbackBox from '@/components/FeedbackBox'
import './globals.css'

const notoSans = Noto_Sans_TC({ 
  subsets: ["latin"],
  variable: '--font-noto-sans',
  weight: ['300', '400', '500', '700']
});

const notoSerif = Noto_Serif_TC({ 
  subsets: ["latin"],
  variable: '--font-noto-serif',
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'YOJN Mégazine — Taichung',
  description: 'A premium nail & aesthetic salon curation directory for Taichung',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" className={`${notoSans.variable} ${notoSerif.variable} bg-background`}>
      <body className="font-sans antialiased min-h-screen">
        <AuthProvider>
          <AuthErrorBanner />
          {children}
          <FeedbackBox />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
