import type { Metadata } from "next"
import localFont from "next/font/local"
import { ThemeProvider } from "@/providers/theme-provider"
import { QueryProvider } from "@/providers/query-provider"
import { SessionProvider } from "@/providers/session-provider"
import { CartProvider } from "@/hooks/use-cart"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geistSans = localFont({
  src: "../fonts/Geist-Variable.woff2",
  variable: "--font-sans",
  display: "swap",
})

const geistMono = localFont({
  src: "../fonts/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "POS - Point of Sales",
  description: "Sistem Manajemen Point of Sales",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider>
          <SessionProvider>
            <QueryProvider>
              <CartProvider>
                {children}
                <Toaster />
              </CartProvider>
            </QueryProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
