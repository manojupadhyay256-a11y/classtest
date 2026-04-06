import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import AuthProvider from "./providers"
import { Toaster } from "react-hot-toast"
import "./globals.css"

const plusJakartaTools = Plus_Jakarta_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DPSMRN Mathura - Class Test Portal",
  description: "Advanced testing and class test portal for DPSMRN Mathura",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={plusJakartaTools.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
