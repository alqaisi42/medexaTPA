import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import '@/styles/print.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'TPA Healthcare System - QUBITY',
    description: 'Health Insurance Third Party Administrator System',
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
