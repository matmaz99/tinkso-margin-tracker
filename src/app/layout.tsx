import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Tinkso Margin Tracker - Real-time Project Profitability',
  description: 'Track project margins in real-time by consolidating revenue data from client invoices and cost data from supplier invoices.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
