import LoginForm from "./login-form"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)

  if (session) {
    if (session.user.role === "teacher") {
      redirect("/admin/dashboard")
    } else {
      redirect("/student/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-mesh p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <div className="max-w-sm w-full glass p-8 rounded-2xl relative z-10 border border-white/40 shadow-2xl">
        <div className="text-center mb-7">
          <div className="inline-block p-3 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 mb-4 shadow-lg shadow-indigo-200">
             <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
             </svg>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mb-1">DPSMRN Mathura</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px]">Class Test Portal</p>
        </div>
        
        <LoginForm />

        <div className="mt-6 text-center flex flex-col space-y-0.5">
          <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">&copy; 2026 DPSMRN Mathura</span>
          <span className="text-[9px] text-teal-600 font-bold">Designed by Manoj Upadhyay (Computer Teacher)</span>
        </div>
      </div>
    </div>
  )
}
