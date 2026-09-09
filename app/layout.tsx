import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Geist } from 'next/font/google'
import { AuthProvider } from '@/components/providers/auth-provider'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-dm-serif' })

export const metadata: Metadata = {
  title: 'Huellas que unen | Adopta una mascota',
  description: 'Encuentra a tu nuevo mejor amigo y cambia dos vidas para siempre.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f8f6f1',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} ${dmSerif.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
