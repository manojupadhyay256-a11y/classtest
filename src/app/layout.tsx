import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import AuthProvider from "./providers"
import { Toaster } from "react-hot-toast"
import PwaRegister from "@/components/pwa-register"
import "./globals.css"

const plusJakartaTools = Plus_Jakarta_Sans({ subsets: ["latin"] })

export const viewport: Viewport = {
  themeColor: "#1f2937",
}

export const metadata: Metadata = {
  title: "DPSMRN Mathura - Class Test Portal",
  description: "Advanced testing and class test portal for DPSMRN Mathura",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DPSMRN Class Test",
    startupImage: ["/icons/icon-512x512.png"],
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
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
        <PwaRegister />
      </body>
    </html>
  )
}
