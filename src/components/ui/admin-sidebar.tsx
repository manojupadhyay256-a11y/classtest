"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Users, FileText, Settings, LogOut, UserCog, BookOpen } from "lucide-react"
import { useSession } from "next-auth/react"

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Students", href: "/admin/students", icon: Users },
  { label: "Teachers", href: "/admin/teachers", icon: UserCog, adminOnly: true },
  { label: "Tests", href: "/admin/tests", icon: FileText },
  { label: "Notes", href: "/admin/notes", icon: BookOpen },
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <div className="w-full md:w-52 bg-slate-900 md:h-screen sticky top-0 z-50 text-white flex flex-col p-3 md:p-4 shadow-md border-b md:border-b-0 md:border-r border-slate-800">
      <div className="flex justify-between items-center mb-3 md:mb-8 px-1">
        <div>
          <h2 className="text-sm font-black text-amber-400 uppercase tracking-tighter leading-none">DPSMRN</h2>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Admin Panel</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="md:hidden flex items-center p-1.5 rounded-lg bg-slate-800 text-red-400 hover:bg-red-600/20 transition-colors"
          title="Logout"
        >
          <LogOut size={14} />
        </button>
      </div>

      <nav className="flex md:flex-col space-x-1 md:space-x-0 md:space-y-1 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
        {navItems.filter(item => !item.adminOnly || isAdmin).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-shrink-0 items-center space-x-2.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap text-sm ${
                isActive
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20 font-bold"
                  : "hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium"
              }`}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="hidden md:flex mt-auto items-center space-x-2.5 px-3 py-2 rounded-lg hover:bg-red-600/15 text-slate-500 hover:text-red-400 transition-all text-sm font-medium"
      >
        <LogOut size={15} />
        <span>Logout</span>
      </button>
    </div>
  )
}
