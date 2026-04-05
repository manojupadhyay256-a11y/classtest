"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { 
  ChevronLeft, 
  Lock, 
  ShieldCheck, 
  Save,
  BrainCircuit,
  Eye,
  EyeOff
} from "lucide-react"
import toast from "react-hot-toast"

export default function StudentSettingsPage() {
  const { data: session } = useSession()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update password")

      toast.success("Password updated successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/60 backdrop-blur-2xl border-b border-slate-200/50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link 
            href="/student/dashboard"
            className="flex items-center space-x-2 text-slate-600 hover:text-teal-600 transition-all font-bold"
          >
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <BrainCircuit size={20} className="text-teal-400" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 pt-32 pb-20">
        <header className="mb-12">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Account Settings</h1>
          <p className="text-slate-500 font-medium italic">Secure your account by updating your profile and password</p>
        </header>

        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-slate-200/50 border border-slate-100">
          {/* Profile Quick Info */}
          <div className="flex items-center space-x-6 mb-12 p-6 bg-slate-50 rounded-3xl border border-slate-100/50">
            <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-teal-500/20">
              {session?.user?.name?.[0].toUpperCase() || "S"}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{session?.user?.name}</h3>
              <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">Adm No: {session?.user?.id}</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-8">
            <div className="space-y-6">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                <Lock size={16} className="mr-2" /> Change Password
              </h4>

              <div className="space-y-4">
                <div className="relative">
                  <label className="text-xs font-bold text-slate-400 ml-4 mb-2 block">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors"
                    >
                      {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                   <div className="relative">
                    <label className="text-xs font-bold text-slate-400 ml-4 mb-2 block">New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600 transition-colors"
                      >
                        {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-xs font-bold text-slate-400 ml-4 mb-2 block">Confirm Password</label>
                    <input
                      type={showNew ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all font-medium"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 premium-gradient text-white font-black text-lg rounded-3xl shadow-xl shadow-teal-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center space-x-3"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={20} />
                  <span>Update Credentials</span>
                </>
              )}
            </button>

            <div className="flex items-center space-x-2 text-slate-400 bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <ShieldCheck size={18} className="text-amber-500 flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-wider leading-relaxed">
                Security Tip: Use a combination of uppercase, lowercase, numbers and symbols for better protection.
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
