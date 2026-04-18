"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { 
  Trophy, 
  ChevronLeft, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  BookOpen, 
  Star,
  Target,
  Clock,
  Layout,
  ExternalLink,
  Sparkles,
  Crown,
  Flame
} from "lucide-react"

interface Result {
  id: string
  score: number
  totalMarks: number
  answers: Record<string, string>
  test: {
    title: string
    subject: string
    isResultsHidden?: boolean
    questions: {
      id: string
      questionText: string
      questionType: string
      correctAnswer: string
      options: Record<string, string> | null
      marks: number
    }[]
  }
}

export default function StudentResultsDetailPage() {
  const params = useParams()
  const resultId = params.id as string
  const [result, setResult] = useState<Result | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/student/results/${resultId}`)
      .then(res => res.json())
      .then(data => {
        setResult(data)
        setIsLoading(false)
      })
  }, [resultId])

  if (isLoading || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="text-teal-500 w-6 h-6 animate-pulse" />
            </div>
          </div>
          <p className="text-teal-500/80 font-black uppercase tracking-[0.2em] text-sm animate-pulse">Calculating Performance...</p>
        </div>
      </div>
    )
  }

  const percentage = Number(((result.score / result.totalMarks) * 100).toFixed(1))
  const isHighScorer = percentage >= 80
  const isPerfectScore = percentage === 100

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-teal-500/30">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="bg-mesh opacity-20 absolute inset-0"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-5 py-12 space-y-10">
        {/* Header Section */}
        <header className="bg-slate-900/80 backdrop-blur-xl shadow-2xl p-8 md:p-12 rounded-[2.5rem] border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Trophy size={160} className="text-white" />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
            <div className="space-y-4">
              <Link 
                href="/student/dashboard" 
                className="inline-flex items-center space-x-2 text-teal-400 font-bold text-xs uppercase tracking-widest transition-colors mb-2"
              >
                <ChevronLeft size={16} />
                <span>Dashboard</span>
              </Link>
              <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight">
                  {result.test.title}
                </h1>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-teal-400 text-[10px] font-black uppercase tracking-widest">
                    {result.test.subject}
                  </span>
                  <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Star size={12} className="text-amber-500" /> Assessment Feedback
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="flex items-baseline justify-end space-x-2">
                  <span className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 leading-none">
                    {result.score}
                  </span>
                  <span className="text-xl md:text-2xl font-bold text-slate-600">/ {result.totalMarks}</span>
                </div>
                <div className={`mt-3 inline-flex items-center space-x-2 px-4 py-1.5 rounded-xl border font-black uppercase tracking-widest text-[11px] ${
                  isHighScorer ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                }`}>
                  <Target size={14} />
                  <span>{percentage}% Mastery</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 🏆 Perfect Score Celebration */}
        {isPerfectScore && (
          <section className="relative overflow-hidden rounded-[2.5rem] border-2 border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-amber-500/10 p-8 md:p-10 text-center">
            {/* Animated shimmer */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-amber-400/10 to-transparent animate-[shimmer_3s_infinite] skew-x-12" />
            </div>
            {/* Sparkle accents */}
            <div className="absolute top-4 left-6 text-amber-400/20 animate-pulse"><Sparkles size={24} /></div>
            <div className="absolute bottom-4 right-6 text-yellow-400/20 animate-pulse" style={{ animationDelay: '1.5s' }}><Star size={20} /></div>
            <div className="absolute top-6 right-10 text-amber-300/15 animate-pulse" style={{ animationDelay: '0.7s' }}><Flame size={18} /></div>

            <div className="relative z-10 space-y-4">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/30 animate-[bounce_3s_ease-in-out_infinite]">
                <Crown size={40} className="text-white drop-shadow-lg" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 tracking-tight">
                  🌟 Perfect Score! 🌟
                </h2>
                <p className="text-amber-200/70 font-medium text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                  Incredible! You answered every single question correctly. Your preparation, focus, and hard work have truly paid off. You&apos;re an inspiration — keep aiming for the stars!
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 px-4 py-2 rounded-2xl">
                  <Trophy size={16} className="text-amber-400" />
                  <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">100% Mastery</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 px-4 py-2 rounded-2xl">
                  <CheckCircle2 size={16} className="text-amber-400" />
                  <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">All Correct</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-500/15 border border-amber-500/25 px-4 py-2 rounded-2xl">
                  <Star size={16} className="text-amber-400 fill-amber-400" />
                  <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider">Champion</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Detailed Analysis Section */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center space-x-3">
              <span className="w-8 h-1 bg-teal-500 rounded-full"></span>
              <span>Performance Breakdown</span>
            </h2>
            {result.test.isResultsHidden && (
              <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/5">
                <Lock size={12} />
                <span>Verification Required</span>
              </div>
            )}
          </div>

          {result.test.isResultsHidden ? (
            <div className="bg-slate-900/80 backdrop-blur-xl shadow-2xl p-16 rounded-[3rem] border-white/10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent"></div>
              <div className="relative z-10 max-w-md mx-auto space-y-6">
                <div className="w-24 h-24 bg-amber-500/10 border-2 border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto text-amber-500 shadow-xl shadow-amber-500/10">
                  <Lock size={40} strokeWidth={2.5} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">Review Period Active</h3>
                  <p className="text-slate-400 font-medium text-sm leading-relaxed">
                    Detailed answer analysis and correct explanations are currently restricted. They will be automatically unlocked once the teacher officially closes the testing window.
                  </p>
                </div>
                <div className="pt-4 flex flex-wrap justify-center gap-4">
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Score Availability</p>
                     <p className="text-teal-400 text-xs font-black">Released</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Detailed Review</p>
                     <p className="text-amber-500 text-xs font-black">Locked</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {result.test.questions.map((q, idx) => {
                const studentAnswer = result.answers[q.id]?.toString().trim() || ""
                const correctAnswer = q.correctAnswer.trim()
                let isCorrect = false

                if (q.questionType === "match") {
                  const studentPairs = studentAnswer.split("|")
                    .map((p: string) => p.trim().toLowerCase())
                    .filter(Boolean)
                    .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
                    .sort()

                  const correctPairs = correctAnswer.split("|")
                    .map((p: string) => p.trim().toLowerCase())
                    .filter(Boolean)
                    .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
                    .sort()

                  isCorrect = studentPairs.length === correctPairs.length && 
                              studentPairs.every((p: string, i: number) => p === correctPairs[i])
                } else if (q.questionType === "jumbled") {
                  isCorrect = studentAnswer.toLowerCase().replace(/\s+/g, "") === correctAnswer.toLowerCase().replace(/\s+/g, "")
                } else if (q.questionType === "fill" || q.questionType === "short") {
                  const validAnswers = correctAnswer.split(",").map((a: string) => a.trim().toLowerCase())
                  isCorrect = validAnswers.includes(studentAnswer.toLowerCase())
                } else {
                  isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase()
                }

                return (
                  <div 
                    key={q.id} 
                    className={`bg-slate-900/80 backdrop-blur-xl shadow-2xl p-8 rounded-3xl border-2 transition-all duration-500 hover:translate-x-1 ${
                      isCorrect ? "border-teal-500/20 shadow-lg shadow-teal-500/5" : "border-rose-500/20 shadow-lg shadow-rose-500/5"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                      <div className="flex items-start space-x-5">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 border ${
                           isCorrect ? "bg-teal-500/10 border-teal-500/30 text-teal-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                         }`}>
                           {idx + 1}
                         </div>
                         <div className="space-y-1.5 pt-0.5">
                           <h3 className="text-lg md:text-xl font-bold text-white leading-tight tracking-tight">
                             {q.questionText}
                           </h3>
                           <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                               <Layout size={12} /> {q.questionType}
                             </span>
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                               <Clock size={12} /> {q.marks} Marks
                             </span>
                           </div>
                         </div>
                      </div>
                      
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 transition-transform hover:scale-110 ${
                        isCorrect ? "bg-teal-500/10 border-teal-500/20 text-teal-400 shadow-lg shadow-teal-500/10" : "bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-lg shadow-rose-500/10"
                      }`}>
                        {isCorrect ? (
                          <>
                            <CheckCircle2 size={18} strokeWidth={3} />
                            <span className="text-xs font-black uppercase tracking-widest font-mono">Precision</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={18} strokeWidth={3} />
                            <span className="text-xs font-black uppercase tracking-widest font-mono">Error detected</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
                      <div className={`p-6 rounded-2xl border transition-all hover:bg-white/5 ${
                        isCorrect ? "bg-teal-500/5 border-teal-500/20" : "bg-rose-500/5 border-rose-500/20"
                      }`}>
                        <p className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Record of Submission</p>
                        <div className="flex items-start gap-3">
                           <p className={`font-extrabold text-lg leading-snug ${isCorrect ? "text-teal-300" : "text-rose-300"}`}>
                             {studentAnswer || "MISSING DATA"}
                           </p>
                        </div>
                      </div>
                      
                      {!isCorrect && (
                        <div className="p-6 rounded-2xl border border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10 transition-all">
                          <p className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Validated Correlation</p>
                          <p className="font-extrabold text-lg text-teal-400 leading-snug">{q.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Footer Navigation */}
        <footer className="pt-8 flex flex-col items-center space-y-6">
          <div className="w-16 h-1 bg-white/5 rounded-full"></div>
          <Link 
            href="/student/dashboard" 
            className="group flex items-center space-x-3 bg-white/5 hover:bg-teal-500 border border-white/10 hover:border-teal-400/50 px-8 py-4 rounded-2xl transition-all duration-500 shadow-lg hover:shadow-teal-500/20"
          >
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
               <BookOpen size={16} />
            </div>
            <span className="font-black text-sm uppercase tracking-widest text-slate-300 group-hover:text-white">Return to Control Center</span>
            <ExternalLink size={14} className="text-slate-500 group-hover:text-white" />
          </Link>
          
          <div className="text-center space-y-1">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em]">Evaluation Integrity Verified</p>
            <p className="text-[9px] text-slate-600 font-medium">Digital Evaluation Platform • DPSMRN Mathura</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
