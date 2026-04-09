"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  ArrowLeft, 
  BrainCircuit, 
  Settings, 
  LogOut,
  Send,
  History,
  CheckCircle2,
  Loader2,
  XCircle
} from "lucide-react"
import { toast } from "react-hot-toast"

interface Feedback {
  id: string
  area: string
  isLiked: boolean
  comment: string | null
  createdAt: string
}

const FEEDBACK_AREAS = [
  "App Interface",
  "Academic Content",
  "Performance",
  "New Features",
  "Overall Experience"
]

export default function StudentFeedbackPage() {
  const { data: session } = useSession()
  const [history, setHistory] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State
  const [selectedArea, setSelectedArea] = useState(FEEDBACK_AREAS[0])
  const [isLiked, setIsLiked] = useState<boolean | null>(null)
  const [comment, setComment] = useState("")

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/student/feedback")
      const data = await res.json()
      if (Array.isArray(data)) setHistory(data)
    } catch (error) {
      console.error("Failed to fetch history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLiked === null) {
      toast.error("Please select Like or Dislike")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/student/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: selectedArea, isLiked, comment })
      })

      if (res.ok) {
        toast.success("Feedback submitted successfully!")
        setComment("")
        setIsLiked(null)
        fetchHistory()
      } else {
        toast.error("Failed to submit feedback")
      }
    } catch (error) {
      toast.error("An error occurred")
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#f8fafc]">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-indigo-50 to-teal-50 opacity-60" />
        <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[35%] h-[35%] bg-indigo-200/20 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="fixed w-full top-0 z-50 bg-white/60 backdrop-blur-2xl border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/student/dashboard" className="flex items-center space-x-1.5 text-slate-500 hover:text-slate-800 transition-colors p-1.5 rounded-lg hover:bg-slate-100">
              <ArrowLeft size={16} />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
                <BrainCircuit size={18} className="text-teal-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-slate-900 font-black text-sm tracking-tight leading-none uppercase">DPSMRN</span>
                <span className="text-slate-400 text-[9px] font-bold tracking-widest uppercase">App Feedback</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            <Link href="/student/settings" className="flex items-center space-x-1.5 text-slate-500 hover:text-teal-600 py-1.5 px-3 rounded-lg hover:bg-teal-50 text-sm">
              <Settings size={15} />
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center space-x-1.5 text-slate-500 hover:text-red-500 py-1.5 px-3 rounded-lg hover:bg-red-50 text-sm">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-5 pt-20 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Submission Form */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600">
                  <MessageSquare size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Tell us more</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Share your thoughts</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Area Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Area of Feedback</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FEEDBACK_AREAS.map(area => (
                      <button
                        key={area}
                        type="button"
                        onClick={() => setSelectedArea(area)}
                        className={`px-3 py-2 text-[11px] font-bold rounded-xl transition-all border outline-none ${
                          selectedArea === area 
                            ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                        }`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Like/Dislike */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your Experience</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsLiked(true)}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                        isLiked === true 
                          ? "bg-teal-50 border-teal-500 text-teal-600 shadow-inner" 
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      <ThumbsUp size={20} fill={isLiked === true ? "currentColor" : "none"} />
                      <span className="font-black text-sm">Like</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLiked(false)}
                      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                        isLiked === false 
                          ? "bg-red-50 border-red-500 text-red-600 shadow-inner" 
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      <ThumbsDown size={20} fill={isLiked === false ? "currentColor" : "none"} />
                      <span className="font-black text-sm">Dislike</span>
                    </button>
                  </div>
                </div>

                {/* Comment */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comments (Optional)</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Tell us what you like or what we can improve..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-sm outline-none transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  Submit Feedback
                </button>
              </form>
            </div>
          </div>

          {/* History */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Your History</h2>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Previous submissions</p>
                </div>
              </div>
              <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded-lg">
                {history.length} Total
              </span>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-slate-300" size={32} />
                </div>
              ) : history.length === 0 ? (
                <div className="bg-white/50 backdrop-blur border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <MessageSquare size={32} />
                  </div>
                  <h3 className="text-slate-900 font-black text-base">No feedback yet</h3>
                  <p className="text-slate-500 text-sm font-medium mt-1">Your feedback helps us grow.</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        {item.isLiked ? (
                          <div className="w-6 h-6 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                            <ThumbsUp size={12} fill="currentColor" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                            <ThumbsDown size={12} fill="currentColor" />
                          </div>
                        )}
                        <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{item.area}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                    </div>
                    {item.comment && (
                      <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                        "{item.comment}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
