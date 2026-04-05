"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
  { label: "Students", href: "/admin/students", icon: "👥" },
  { label: "Tests", href: "/admin/tests", icon: "📝" },
  { label: "Settings", href: "/admin/settings", icon: "⚙️" },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-full md:w-64 bg-gray-900 md:h-screen sticky top-0 z-50 text-white flex flex-col p-4 md:p-6 shadow-md border-b md:border-b-0 md:border-r border-gray-800">
      <div className="flex justify-between items-center mb-4 md:mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-amber-500 uppercase tracking-tighter">DPSMRN Admin</h2>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="md:hidden flex items-center p-2 rounded-lg bg-gray-800 text-red-400 hover:bg-red-600/20 transition-colors"
          title="Logout"
        >
          <span className="text-lg">🚪</span>
        </button>
      </div>

      <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-shrink-0 items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors whitespace-nowrap ${
              pathname === item.href ? "bg-amber-600 text-white shadow-md shadow-amber-600/20" : "hover:bg-gray-800 text-gray-400"
            }`}
          >
            <span>{item.icon}</span>
            <span className="font-medium text-sm md:text-base">{item.label}</span>
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="hidden md:flex mt-auto items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-600/20 text-red-400 transition-colors"
      >
        <span>🚪</span>
        <span className="font-medium">Logout</span>
      </button>
    </div>
  )
}
