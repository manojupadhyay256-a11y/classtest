import prisma from "@/lib/prisma"
import Link from "next/link"
import { Users, FileText, CheckCircle2, TrendingUp, Clock, ArrowUpRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const studentCount = await prisma.student.count()
  const testCount = await prisma.test.count()
  const resultCount = await prisma.result.count()
  
  const recentResults = await prisma.result.findMany({
    take: 6,
    orderBy: { submittedAt: "desc" },
    include: { student: true, test: true }
  })

  // Calculate average score percentage
  const allResults = await prisma.result.findMany({ select: { score: true, totalMarks: true } })
  const avgPercentage = allResults.length > 0 
    ? Math.round((allResults.reduce((acc, curr) => acc + (curr.score / curr.totalMarks), 0) / allResults.length) * 100)
    : 0

  const stats = [
    { label: "Total Students", value: studentCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Tests Created", value: testCount, icon: FileText, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Total Attempts", value: resultCount, icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Avg. Performance", value: `${avgPercentage}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
  ]

  return (
    <div className="space-y-10 pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Admin Overview</h1>
          <p className="text-slate-500 font-medium">Control center for your class test ecosystem</p>
        </div>
        <div className="flex space-x-3">
           <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-100 italic text-slate-400 text-sm">
             <Clock className="w-4 h-4" />
             <span>Last updated: just now</span>
           </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass p-6 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/40 interactive-hover">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-black text-slate-900">{stat.value}</span>
              <span className="text-teal-500 text-xs font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                Live
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Submissions */}
        <div className="lg:col-span-2 glass rounded-[2.5rem] border border-white/40 shadow-2xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-white/20 flex justify-between items-center">
            <h3 className="text-xl font-black text-slate-900 flex items-center">
              <Clock className="w-5 h-5 mr-3 text-indigo-500" />
              Latest Exam Activity
            </h3>
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">View All &rarr;</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Test</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Score</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentResults.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-medium">No submission records found yet.</td>
                  </tr>
                ) : (
                  recentResults.map((result) => (
                    <tr key={result.id} className="hover:bg-white/40 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-black text-sm">
                            {result.student.name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-800">{result.student.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-semibold text-slate-600">{result.test.title}</span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-xl font-black text-xs ${
                          (result.score / result.totalMarks) >= 0.8 
                          ? "bg-teal-50 text-teal-600 border border-teal-100" 
                          : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          {result.score}/{result.totalMarks}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-xs font-bold text-slate-400">
                          {new Date(result.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <FileText className="w-24 h-24" />
              </div>
              <h3 className="text-xl font-bold mb-2 relative z-10">New Test?</h3>
              <p className="text-slate-400 text-sm mb-6 relative z-10 leading-relaxed font-medium">
                Create and publish a new class test in minutes with our advanced question builder.
              </p>
              <Link 
                href="/admin/tests/create"
                className="block w-full bg-white text-slate-900 font-black py-4 rounded-2xl shadow-xl hover:bg-slate-50 transition-all active:scale-95 relative z-10 text-center"
              >
                Launch Creator
              </Link>
           </div>

           <div className="glass p-8 rounded-[2rem] border border-white/40">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">System Status</h4>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-600">Database Engine</span>
                   <span className="w-2 h-2 rounded-full bg-teal-500" />
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-600">Secure Auth Service</span>
                   <span className="w-2 h-2 rounded-full bg-teal-500" />
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-600">Storage API</span>
                   <span className="w-2 h-2 rounded-full bg-teal-500" />
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
