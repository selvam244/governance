import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from './components/Header'
import Web3Provider from '../providers/Web3Provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Arbitrum Governance',
  description: 'Arbitrum governance dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Web3Provider>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="bg-gray-50">
              {children}
            </div>
          </div>
        </Web3Provider>
      </body>
    </html>
  )
}
