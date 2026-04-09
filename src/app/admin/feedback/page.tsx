import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Filter,
  BarChart3,
  Clock
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminFeedbackPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const feedbacks = await prisma.feedback.findMany({
    include: {
      student: {
        select: {
          name: true,
          class: true,
          section: true,
          admno: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  // Basic Stats
  const totalFeedback = feedbacks.length
  const positiveFeedback = feedbacks.filter(f => f.isLiked).length
  const negativeFeedback = totalFeedback - positiveFeedback
  const positiveRate = totalFeedback > 0 ? Math.round((positiveFeedback / totalFeedback) * 100) : 0

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Feedback</h1>
        <p className="text-slate-400 text-sm font-medium">Review likes and comments about the app</p>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-4 rounded-2xl border border-white/40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Impressions</span>
            <MessageSquare size={14} className="text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalFeedback}</div>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Positive Rate</span>
            <ThumbsUp size={14} className="text-teal-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-black text-slate-900">{positiveRate}%</div>
            <div className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-md">High</div>
          </div>
        </div>
        <div className="glass p-4 rounded-2xl border border-white/40 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sentiment</span>
            <div className="flex gap-1 text-slate-400">
              <ThumbsUp size={12} />
              <ThumbsDown size={12} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-lg font-black text-teal-600 leading-none">{positiveFeedback}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Liked</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-lg font-black text-red-500 leading-none">{negativeFeedback}</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Disliked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Feed */}
      <div className="glass rounded-2xl border border-white/40 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/20 flex justify-between items-center bg-white/40">
          <h3 className="text-sm font-black text-slate-900 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" />
            Feedback Feed
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
              <Filter size={10} className="mr-1" />
              Latest First
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {feedbacks.length === 0 ? (
            <div className="px-5 py-20 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <BarChart3 size={32} />
              </div>
              <h3 className="text-slate-900 font-black text-base">No feedback yet</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Feedback will appear here once students submit it.</p>
            </div>
          ) : (
            feedbacks.map((f) => (
              <div key={f.id} className="p-5 hover:bg-white/40 transition-all group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                       {f.isLiked ? (
                          <div className="w-6 h-6 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600 shadow-sm border border-teal-100">
                            <ThumbsUp size={12} fill="currentColor" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center text-red-600 shadow-sm border border-red-100">
                            <ThumbsDown size={12} fill="currentColor" />
                          </div>
                        )}
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                          {f.area}
                        </span>
                    </div>
                    {f.comment ? (
                      <p className="text-sm font-medium text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 italic">
                        &quot;{f.comment}&quot;
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 font-bold italic uppercase tracking-wider">No comment provided.</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center space-x-2.5 bg-white p-1.5 pr-3 rounded-xl shadow-sm border border-slate-100 min-w-[160px]">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-[10px] flex-shrink-0 border border-indigo-100">
                        {f.student.name.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-slate-800 text-[11px] truncate leading-none mb-0.5">{f.student.name}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Class {f.student.class}-{f.student.section}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                      <Clock size={10} />
                      {new Date(f.createdAt).toLocaleString('en-IN', {
                         day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
