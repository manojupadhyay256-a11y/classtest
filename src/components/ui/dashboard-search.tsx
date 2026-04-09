"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowRight } from "lucide-react"

export default function DashboardSearch() {
  const [query, setQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/admin/students?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form 
      onSubmit={handleSearch}
      className="glass p-5 rounded-2xl border border-white/40 shadow-xl relative overflow-hidden group mb-6"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
        <Search className="w-16 h-16" />
      </div>
      
      <h3 className="text-sm font-black text-slate-900 mb-1 relative z-10 flex items-center">
        <Search className="w-4 h-4 mr-2 text-indigo-500" />
        Quick Student Search
      </h3>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 relative z-10">
        Find by Name, Admission No or Class
      </p>

      <div className="relative z-10 flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type student details..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white/50 border border-slate-200 text-slate-900 font-bold px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 placeholder:font-medium"
          />
        </div>
        <button
          type="submit"
          className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 flex-shrink-0"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  )
}
