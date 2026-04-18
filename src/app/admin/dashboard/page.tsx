import prisma from "@/lib/prisma"
import Link from "next/link"
import { Users, FileText, CheckCircle2, TrendingUp, Clock, ArrowUpRight } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import DashboardSearch from "@/components/ui/dashboard-search"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "ADMIN"
  const userId = session.user.id

  const studentCount = await prisma.student.count()
  const testCount = await prisma.test.count({
    where: isAdmin ? {} : { createdBy: userId }
  })
  const resultCount = await prisma.result.count({
    where: isAdmin ? {} : { test: { createdBy: userId } }
  })
  
   const recentResults = await prisma.result.findMany({
    take: 6,
    where: isAdmin ? {} : { test: { createdBy: userId } },
    orderBy: { submittedAt: "desc" },
    include: { student: true, test: true }
  })

  // Fetch recent logins if admin
  const recentLogins = isAdmin ? await prisma.loginLog.findMany({
    take: 8,
    orderBy: { timestamp: "desc" }
  }) : []

  // Calculate average score percentage
  const allResults = await prisma.result.findMany({ 
    where: isAdmin ? {} : { test: { createdBy: userId } },
    select: { score: true, totalMarks: true } 
  })
  const avgPercentage = allResults.length > 0 
    ? Math.round((allResults.reduce((acc: number, curr: { score: number, totalMarks: number }) => acc + (curr.score / curr.totalMarks), 0) / allResults.length) * 100)
    : 0

  const stats = [
    { label: "Total Students", value: studentCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Tests Created", value: testCount, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Attempts", value: resultCount, icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Avg. Performance", value: `${avgPercentage}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
  ]

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {isAdmin ? "Admin Overview" : "Teacher Overview"}
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            {isAdmin ? "Control center for your class test ecosystem" : "Your personal test management portal"}
          </p>
        </div>
        <div className="flex space-x-3">
           <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-slate-100 italic text-slate-400 text-xs">
             <Clock className="w-3.5 h-3.5" />
             <span>Last updated: {new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} (IST)</span>
           </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-4 rounded-2xl border border-white/40 shadow-lg shadow-slate-200/40 interactive-hover">
            <div className={`w-9 h-9 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{stat.label}</p>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-slate-900">{stat.value}</span>
              <span className="text-teal-500 text-[10px] font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                Live
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions */}
        <div className="lg:col-span-2 glass rounded-2xl border border-white/40 shadow-xl overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-white/20 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-indigo-500" />
              Latest Exam Activity
            </h3>
            <Link href="/admin/tests" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All &rarr;</Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Test</th>
                  <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                  <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentResults.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-slate-400 text-sm font-medium">No submission records found yet.</td>
                  </tr>
                ) : (
                  recentResults.map((result: { 
                    id: string, 
                    score: number, 
                    totalMarks: number, 
                    submittedAt: Date,
                    student: { name: string, admno: string }, 
                    test: { title: string } 
                  }) => (
                    <tr key={result.id} className="hover:bg-white/40 transition-colors group">
                      <td className="px-5 py-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-black text-xs flex-shrink-0">
                            {result.student.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800 text-sm">{result.student.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs font-semibold text-slate-600 line-clamp-1">{result.test.title}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] ${
                          (result.score / result.totalMarks) >= 0.8 
                          ? "bg-teal-50 text-teal-600 border border-teal-100" 
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          {result.score}/{result.totalMarks}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[10px] font-bold text-slate-400">
                          {new Date(result.submittedAt).toLocaleTimeString('en-IN', { 
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Center / Quick Tips */}
        <div className="lg:col-span-1 space-y-4">
           <DashboardSearch />
           <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <FileText className="w-16 h-16" />
              </div>
              <h3 className="text-base font-bold mb-1 relative z-10">New Test?</h3>
              <p className="text-slate-400 text-xs mb-5 relative z-10 leading-relaxed font-medium">
                Create and publish a new class test in minutes with our advanced question builder.
              </p>
              <Link 
                href="/admin/tests/create"
                className="block w-full bg-white text-slate-900 font-black py-2.5 rounded-xl shadow-lg hover:bg-slate-50 transition-all active:scale-95 relative z-10 text-center text-sm"
              >
                Launch Creator
              </Link>
           </div>

           <div className="glass p-5 rounded-2xl border border-white/40">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">System Status</h4>
              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-600">Database Engine</span>
                   <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-600">Secure Auth Service</span>
                   <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                 </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Storage API</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                  </div>
               </div>
            </div>

            {isAdmin && (
              <div className="glass p-5 rounded-2xl border border-white/40">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center">
                  <Clock className="w-3 h-3 mr-1.5" />
                  Recent User Logins
                </h4>
                <div className="space-y-3">
                  {recentLogins.length === 0 ? (
                    <div className="text-center py-2">
                       <p className="text-[10px] text-slate-400 italic">No login activity recorded.</p>
                       <p className="text-[8px] text-amber-600 mt-1 font-bold">(Logout & Login again to record activity)</p>
                    </div>
                  ) : (
                    recentLogins.map((log) => (
                      <div key={log.id} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            log.userRole === 'ADMIN' ? 'bg-amber-400' : 
                            log.userRole === 'TEACHER' ? 'bg-indigo-400' : 'bg-slate-300'
                          }`} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-slate-700 truncate">{log.userName}</span>
                            <span className="text-[9px] font-medium text-slate-400">{log.userRole}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
         </div>
      </div>
    </div>
  )
}
