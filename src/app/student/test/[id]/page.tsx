"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { Timer, ChevronLeft, ChevronRight, CheckCircle2, Flag, X, ArrowRight, Eye, Send, Sparkles, Shield, Zap } from "lucide-react"
import TestPreviewSummary from "@/components/student/test-preview-summary"

interface Question {
  id: string
  questionText: string
  questionType: string
  correctAnswer: string
  options: {
    tokens?: string[]
    left?: string[]
    right?: string[]
    [key: string]: string[] | string | Record<string, string> | undefined | null
  } | null
  marks: number
}

interface Test {
  id: string
  title: string
  duration: number
  questions: Question[]
}

export default function StudentTestPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const testId = params.id as string
  const isPreview = searchParams.get("mode") === "preview"
  const isTeacher = session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"

  const [test, setTest] = useState<Test | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showPreviewSummary, setShowPreviewSummary] = useState(false)
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right')
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Local state for interactive questions
  const [matchSelection, setMatchSelection] = useState<string | null>(null)
  
  const questionRef = useRef<HTMLDivElement>(null)

  const fetchTest = useCallback(async () => {
    try {
      const res = await fetch(`/api/student/test/${testId}`)
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
        router.push(isTeacher ? "/admin/tests" : "/student/dashboard")
        return
      }
      setTest(data)
      setTimeLeft(data.duration * 60)
      setIsLoading(false)
    } catch {
      toast.error("Failed to load test")
      router.push(isTeacher ? "/admin/tests" : "/student/dashboard")
    }
  }, [testId, router, isTeacher])

  useEffect(() => {
    fetchTest()
  }, [fetchTest])

  const submitTest = useCallback(async () => {
    if (isSubmitting) return

    if (isPreview && isTeacher) {
      setShowPreviewSummary(true)
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/student/test/${testId}`, {
        method: "POST",
        body: JSON.stringify({
          answers,
          timeTaken: Math.max(0, (test?.duration || 0) * 60 - timeLeft)
        }),
        headers: { "Content-Type": "application/json" }
      })

      if (res.ok) {
        toast.success("Test submitted successfully!")
        router.push("/student/dashboard")
      } else {
        toast.error("Submission failed. Retrying...")
        setIsSubmitting(false)
      }
    } catch {
      toast.error("Network error during submission")
      setIsSubmitting(false)
    }
  }, [testId, answers, timeLeft, test?.duration, router, isSubmitting, isPreview, isTeacher])

  useEffect(() => {
    if (timeLeft <= 0 && !isLoading && test) {
      submitTest()
      return
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isLoading, test, submitTest])

  const currentQ = test?.questions[currentIdx]

  const navigateQuestion = (newIdx: number) => {
    if (newIdx === currentIdx || isTransitioning) return
    setSlideDir(newIdx > currentIdx ? 'right' : 'left')
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentIdx(newIdx)
      setTimeout(() => setIsTransitioning(false), 50)
    }, 150)
  }

  const availableJumbledTokens = useMemo(() => {
    if (!currentQ || currentQ.questionType !== "jumbled") return []
    const allTokens = [...(currentQ.options?.tokens || [])]
    const isLetterJumble = allTokens.every(t => typeof t === 'string' && t.length === 1)
    const separator = isLetterJumble ? "" : " "
    const selectedTokens = (answers[currentQ.id] || "").split(separator).filter(Boolean)
    
    const pool = [...allTokens]
    selectedTokens.forEach(t => {
      const idx = pool.indexOf(t)
      if (idx !== -1) pool.splice(idx, 1)
    })
    return pool
  }, [currentQ, answers])

  const matchMapping = useMemo(() => {
    if (!currentQ || currentQ.questionType !== "match") return {}
    if (!answers[currentQ.id]) return {}
    return Object.fromEntries(answers[currentQ.id].split("|").map(pair => pair.split(":")))
  }, [currentQ, answers])

  // Format timer
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timerUrgent = timeLeft < 300
  const timerCritical = timeLeft < 60

  if (isLoading || !test) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
      }}>
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-teal-400/30 rounded-full" />
          <div className="absolute inset-0 w-24 h-24 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-teal-400 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Preparing Your Test</h2>
        <p className="text-slate-400 font-medium">Setting up your secure environment...</p>
        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!test.questions || test.questions.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
      }}>
        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 border border-slate-700">
          <X className="w-10 h-10 text-slate-500" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">No Questions Found</h2>
        <p className="text-slate-400 font-medium">This test hasn&apos;t been set up yet. Contact your teacher.</p>
        <button 
          onClick={() => router.push(isTeacher ? "/admin/tests" : "/student/dashboard")}
          className="mt-8 bg-white text-slate-900 px-8 py-3.5 rounded-2xl font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const isLast = currentIdx === test.questions.length - 1
  const progress = ((currentIdx + 1) / test.questions.length) * 100
  const answeredCount = Object.keys(answers).length
  const totalQuestions = test.questions.length

  const handleJumbledClick = (token: string, isFromPool: boolean) => {
    if (!currentQ) return
    const isLetterJumble = (currentQ.options as { tokens?: string[] })?.tokens?.every((t: string | unknown) => typeof t === 'string' && t.length === 1) || false
    const separator = isLetterJumble ? "" : " "
    
    const currentAnswer = answers[currentQ.id] || ""
    const selectedTokens = currentAnswer ? currentAnswer.split(separator).filter(Boolean) : []
    
    if (isFromPool) {
      const newAnswer = [...selectedTokens, token].join(separator)
      setAnswers({ ...answers, [currentQ.id]: newAnswer })
    } else {
      const firstOccurrenceIdx = selectedTokens.indexOf(token)
      if (firstOccurrenceIdx !== -1) {
        selectedTokens.splice(firstOccurrenceIdx, 1)
        const newAnswer = selectedTokens.join(separator)
        setAnswers({ ...answers, [currentQ.id]: newAnswer })
      }
    }
  }

  const handleMatchClick = (item: string, isLeft: boolean) => {
    if (!currentQ) return
    if (isLeft) {
      setMatchSelection(item)
    } else if (matchSelection) {
      const currentMapping = answers[currentQ.id] 
        ? Object.fromEntries(answers[currentQ.id].split("|").map(pair => pair.split(":")))
        : {}
      
      currentMapping[matchSelection] = item
      const newAnswer = Object.entries(currentMapping).map(([k, v]) => `${k}:${v}`).join("|")
      setAnswers({ ...answers, [currentQ.id]: newAnswer })
      setMatchSelection(null)
    }
  }

  // Question type label
  const qTypeLabel = (type: string) => {
    switch (type) {
      case 'mcq': return 'Multiple Choice'
      case 'truefalse': return 'True / False'
      case 'fill': return 'Fill in the Blank'
      case 'short': return 'Short Answer'
      case 'jumbled': return 'Rearrange'
      case 'match': return 'Match the Following'
      default: return type
    }
  }

  // Progress ring for sidebar
  const circumference = 2 * Math.PI * 18
  const progressOffset = circumference - (answeredCount / totalQuestions) * circumference

  return (
    <div className="min-h-screen text-white font-sans relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)'
    }}>
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-[40%] right-[20%] w-[20%] h-[20%] bg-violet-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '8s' }} />
      </div>

      {showPreviewSummary && isTeacher && (
        <TestPreviewSummary 
          test={test} 
          answers={answers} 
          onClose={() => setShowPreviewSummary(false)} 
        />
      )}

      {/* ─── Top Navigation Bar ─── */}
      <nav className="sticky top-0 z-50 px-3 md:px-6 py-2.5 md:py-3 border-b border-white/[0.06]" style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.8)'
      }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20 flex-shrink-0">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm md:text-base font-black tracking-tight text-white truncate">{test.title}</h1>
              <div className="flex items-center space-x-2 mt-0.5">
                {isPreview && isTeacher ? (
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 flex items-center gap-1">
                    <Eye className="w-2.5 h-2.5" />
                    Preview
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Live
                  </span>
                )}
                <span className="text-[10px] font-semibold text-slate-500">
                  {answeredCount}/{totalQuestions} done
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3 w-full md:w-auto justify-end">
            {/* Timer */}
            <div className={`flex items-center space-x-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl font-mono text-base md:text-lg font-black transition-all border ${
              timerCritical
                ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse shadow-lg shadow-red-500/10"
                : timerUrgent
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/20 shadow-lg shadow-amber-500/10"
                  : "bg-white/5 text-white border-white/10"
            }`}>
              <Timer className="w-4 h-4 opacity-60" />
              <span>{minutes}:{seconds.toString().padStart(2, "0")}</span>
            </div>
            
            <button 
              onClick={submitTest}
              disabled={isSubmitting}
              className="flex bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 items-center space-x-1.5 md:space-x-2 text-xs md:text-sm border border-emerald-400/20 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Final Submit</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Progress Bar ─── */}
      <div className="w-full h-1 bg-white/[0.04] relative">
        <div 
          className="absolute top-0 left-0 h-full transition-all duration-700 ease-out rounded-r-full"
          style={{ 
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #14b8a6, #6366f1, #8b5cf6)'
          }}
        />
        <div 
          className="absolute top-0 h-full transition-all duration-700 ease-out rounded-r-full blur-sm opacity-60"
          style={{ 
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #14b8a6, #6366f1, #8b5cf6)'
          }}
        />
      </div>

      {/* ─── Main Content ─── */}
      <main className="max-w-7xl mx-auto p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 mt-2">
        
        {/* ─── Question Area (Main Column) ─── */}
        <div className="lg:col-span-9 space-y-4 md:space-y-5">
          <div 
            ref={questionRef}
            className={`relative rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-300 ${
              isTransitioning 
                ? slideDir === 'right' 
                  ? 'opacity-0 translate-x-4' 
                  : 'opacity-0 -translate-x-4'
                : 'opacity-100 translate-x-0'
            }`}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(40px)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Accent line */}
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-3xl overflow-hidden">
              <div className="h-full" style={{ background: 'linear-gradient(90deg, #14b8a6, #6366f1, #8b5cf6)' }} />
            </div>

            <div className="p-5 md:p-8 pt-6 md:pt-10">
              {/* Question Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 md:mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-teal-400/20 to-indigo-400/20 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10 flex-shrink-0">
                    <span className="text-sm md:text-lg font-black text-white">{currentIdx + 1}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">Question {currentIdx + 1} of {totalQuestions}</p>
                    <p className="text-[10px] font-semibold text-teal-400/70 uppercase tracking-wider mt-0.5">{qTypeLabel(currentQ!.questionType)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-400/10 text-amber-400 text-[10px] font-black px-3 py-1.5 rounded-lg border border-amber-400/20 uppercase tracking-wider">
                    {currentQ!.marks} {currentQ!.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                  <button className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-all" title="Flag for review">
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-lg md:text-2xl font-bold text-white leading-relaxed mb-6 md:mb-8 pr-4">
                {currentQ ? currentQ.questionText : "Loading question..."}
              </h2>

              {/* Teacher Preview: Correct Answer */}
              {isPreview && isTeacher && (
                <div className="mb-8 bg-indigo-400/10 border border-indigo-400/20 p-5 rounded-2xl">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                    <Eye className="w-3 h-3" /> Teacher Reference
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400">Answer:</span>
                    <span className="text-base font-black text-white select-all">{currentQ?.correctAnswer}</span>
                  </div>
                </div>
              )}

              {/* ─── Answer Options ─── */}
              <div className="space-y-4">

                {/* MCQ */}
                {currentQ?.questionType === "mcq" && currentQ?.options && (
                  <div className="grid grid-cols-1 gap-3">
                    {(["a","b","c","d"] as const).filter(key => currentQ?.options && (currentQ?.options as Record<string,string>)[key]).map((key, i) => {
                      const isSelected = answers[currentQ!.id] === key
                      const isCorrectPreview = isPreview && isTeacher && currentQ!.correctAnswer === key
                      return (
                        <button
                          key={key}
                          onClick={() => setAnswers({ ...answers, [currentQ!.id]: key })}
                          className="group w-full text-left relative overflow-hidden transition-all duration-300 active:scale-[0.98]"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <div className={`flex items-center p-3.5 md:p-5 rounded-xl md:rounded-2xl border transition-all duration-300 gap-3 md:gap-4 ${
                            isSelected
                              ? "bg-gradient-to-r from-teal-500/20 to-indigo-500/20 border-teal-400/40 shadow-lg shadow-teal-500/10"
                              : isCorrectPreview
                                ? "bg-emerald-500/10 border-emerald-400/30"
                                : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10"
                          }`}>
                            <span className={`w-9 h-9 md:w-11 md:h-11 flex-shrink-0 rounded-xl flex items-center justify-center font-black text-sm md:text-base transition-all ${
                              isSelected
                                ? "bg-teal-400 text-slate-900 shadow-lg shadow-teal-400/30"
                                : isCorrectPreview
                                  ? "bg-emerald-400/20 text-emerald-400"
                                  : "bg-white/[0.06] text-slate-500 group-hover:text-slate-300 group-hover:bg-white/10"
                            }`}>
                              {key.toUpperCase()}
                            </span>
                            <span className={`font-semibold text-sm md:text-base break-words flex-1 transition-colors ${
                              isSelected ? "text-white" : "text-slate-300 group-hover:text-white"
                            }`}>
                              {(currentQ!.options as Record<string,string>)[key]}
                            </span>
                            {isSelected && (
                              <div className="flex-shrink-0">
                                <div className="w-7 h-7 bg-teal-400 rounded-full flex items-center justify-center shadow-lg shadow-teal-400/30">
                                  <CheckCircle2 className="w-4 h-4 text-slate-900" />
                                </div>
                              </div>
                            )}
                            {isCorrectPreview && !isSelected && (
                              <span className="flex-shrink-0 text-emerald-400 font-black text-[9px] uppercase tracking-widest bg-emerald-400/10 px-2.5 py-1 rounded-lg border border-emerald-400/20">
                                Correct
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* True / False */}
                {currentQ!.questionType === "truefalse" && (
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {["true", "false"].map((opt) => {
                      const isSelected = answers[currentQ!.id] === opt
                      const isCorrectPreview = isPreview && isTeacher && currentQ!.correctAnswer === opt
                      return (
                        <button
                          key={opt}
                          onClick={() => setAnswers({ ...answers, [currentQ!.id]: opt })}
                          className={`group relative overflow-hidden py-8 md:py-12 rounded-2xl md:rounded-3xl border-2 text-xl md:text-2xl font-black uppercase transition-all duration-300 active:scale-[0.97] ${
                            isSelected
                              ? opt === "true"
                                ? "bg-gradient-to-br from-emerald-400/20 to-teal-500/20 border-emerald-400/40 text-emerald-400 shadow-xl shadow-emerald-500/10"
                                : "bg-gradient-to-br from-rose-400/20 to-pink-500/20 border-rose-400/40 text-rose-400 shadow-xl shadow-rose-500/10"
                              : isCorrectPreview
                                ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-400"
                                : "bg-white/[0.03] border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/[0.06] hover:border-white/10"
                          }`}
                        >
                          {opt}
                          {isSelected && (
                            <div className="absolute top-3 right-3">
                              <CheckCircle2 className="w-6 h-6 opacity-50" />
                            </div>
                          )}
                          {isCorrectPreview && !isSelected && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-widest text-emerald-400">
                              Correct
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Fill / Short */}
                {(currentQ!.questionType === "fill" || currentQ!.questionType === "short") && (
                  <div className="relative">
                    <input 
                      type="text"
                      value={answers[currentQ!.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [currentQ!.id]: e.target.value })}
                      placeholder={currentQ!.questionType === "fill" ? "Type your answer here..." : "Write your answer..."}
                      className="w-full p-5 md:p-6 text-base md:text-lg font-semibold rounded-2xl border bg-white/[0.04] border-white/[0.08] text-white placeholder-slate-600 focus:bg-white/[0.06] focus:border-teal-400/50 focus:ring-2 focus:ring-teal-400/10 transition-all outline-none"
                    />
                    {answers[currentQ!.id] && (
                      <div className="absolute right-5 top-1/2 -translate-y-1/2">
                        <div className="w-7 h-7 bg-teal-400/20 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-teal-400" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Jumbled */}
                {currentQ!.questionType === "jumbled" && (
                  <div className="space-y-5">
                    {/* Drop zone */}
                    <div className="p-5 md:p-6 min-h-[90px] rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] flex flex-wrap gap-2 items-center justify-center relative transition-all">
                      {(() => {
                        const isLetterJumble = (currentQ!.options as { tokens?: string[] })?.tokens?.every((t: string | unknown) => typeof t === 'string' && t.length === 1) || false;
                        const separator = isLetterJumble ? "" : " ";
                        const tokens = (answers[currentQ!.id] || "").split(separator).filter(t => t);
                        
                        return tokens.length > 0 ? (
                          tokens.map((token, i) => (
                            <button
                              key={`${token}-${i}`}
                              onClick={() => handleJumbledClick(token, false)}
                              className="bg-gradient-to-r from-teal-400 to-indigo-500 text-white px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl font-bold shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center hover:from-red-400 hover:to-rose-500 hover:shadow-red-500/20 group text-xs md:text-sm"
                            >
                              {token}
                              <X className="w-3 h-3 ml-1.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-2">
                            <Sparkles className="w-5 h-5 text-slate-600 mx-auto mb-1.5" />
                            <span className="text-slate-600 font-semibold text-xs">Tap tiles below to build your answer</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Pool */}
                    <div className="flex flex-wrap gap-2 justify-center">
                      {availableJumbledTokens.map((token, i) => (
                        <button
                          key={`${token}-${i}`}
                          onClick={() => handleJumbledClick(token, true)}
                          className="bg-white/[0.06] border border-white/10 px-3.5 py-2 md:px-4 md:py-2.5 rounded-xl font-bold text-slate-300 hover:border-teal-400/50 hover:text-teal-400 hover:bg-teal-400/10 transition-all active:scale-95 text-xs md:text-sm"
                        >
                          {token}
                        </button>
                      ))}
                    </div>

                    {/* Direct input */}
                    <div className="pt-4 border-t border-white/[0.06]">
                      <input 
                        type="text"
                        value={answers[currentQ!.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [currentQ!.id]: e.target.value })}
                        placeholder="Or type answer directly..."
                        className="w-full text-center p-4 text-sm md:text-base font-semibold rounded-xl border bg-white/[0.03] border-white/[0.06] text-white placeholder-slate-600 focus:bg-white/[0.05] focus:border-teal-400/40 transition-all outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Match */}
                {currentQ!.questionType === "match" && (
                  <div className="space-y-4">
                    {matchSelection && (
                      <div className="text-center py-2 px-4 rounded-xl bg-indigo-400/10 border border-indigo-400/20">
                        <p className="text-xs font-bold text-indigo-400">
                          Now select from Column B to match with &quot;<span className="text-white">{matchSelection}</span>&quot;
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-teal-400/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-teal-400 rounded-full" />
                          Column A
                        </h3>
                        {(currentQ!.options?.left || []).map((item: string) => (
                          <button
                            key={item}
                            onClick={() => handleMatchClick(item, true)}
                            className={`w-full text-left p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all font-semibold flex justify-between items-center text-sm active:scale-[0.98] ${
                              matchMapping[item] 
                                ? "bg-teal-400/10 border-teal-400/30 text-teal-300" 
                                : matchSelection === item
                                  ? "bg-gradient-to-r from-teal-400/20 to-indigo-400/20 border-teal-400/40 text-white shadow-lg shadow-teal-500/10"
                                  : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-teal-400/30 hover:text-white hover:bg-white/[0.05]"
                            }`}
                          >
                            {item}
                            {matchMapping[item] && <ArrowRight className="w-4 h-4 opacity-50" />}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-indigo-400/70 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                          Column B
                        </h3>
                        {(currentQ!.options?.right || []).map((item: string) => (
                          <button
                            key={item}
                            onClick={() => handleMatchClick(item, false)}
                            className={`w-full text-left p-4 md:p-5 rounded-xl md:rounded-2xl border transition-all font-semibold text-sm active:scale-[0.98] ${
                              Object.values(matchMapping).includes(item)
                                ? "bg-indigo-400/10 border-indigo-400/30 text-indigo-300"
                                : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-indigo-400/30 hover:text-white hover:bg-white/[0.05]"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              {item}
                              {Object.entries(matchMapping).some(([, v]) => v === item) && (
                                <span className="text-[9px] bg-indigo-400/15 px-2 py-1 rounded-lg border border-indigo-400/20 text-indigo-400 uppercase font-black tracking-wider">
                                  Matched
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Navigation Footer ─── */}
              <div className="flex justify-between items-center pt-6 mt-8 border-t border-white/[0.06] gap-3">
                <button 
                  disabled={currentIdx === 0}
                  onClick={() => navigateQuestion(currentIdx - 1)}
                  className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-black text-slate-400 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all flex items-center space-x-2 group active:scale-95 text-sm"
                >
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="hidden md:inline">Previous</span>
                </button>

                {isLast ? (
                  <button 
                    onClick={submitTest}
                    disabled={isSubmitting}
                    className="px-6 md:px-10 py-3 md:py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-900 font-black text-sm md:text-base transition-all shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmitting ? "Submitting..." : isPreview && isTeacher ? "View Results" : "Final Submit"}
                  </button>
                ) : (
                  <button 
                    onClick={() => navigateQuestion(currentIdx + 1)}
                    className="px-5 md:px-8 py-3 md:py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-black text-sm md:text-base transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 flex items-center space-x-2 group"
                  >
                    <span>Next Question</span>
                    <ChevronRight className="w-4 md:w-5 h-4 md:h-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Sidebar ─── */}
        <aside className="lg:col-span-3 space-y-4 md:space-y-5">
          {/* Progress Ring + Stats */}
          <div className="rounded-2xl p-5 md:p-6" style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress</h3>
              <span className="text-xs font-bold text-teal-400">{Math.round((answeredCount / totalQuestions) * 100)}%</span>
            </div>
            
            <div className="flex justify-center mb-5">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                <circle 
                  cx="22" cy="22" r="18" fill="none" 
                  strokeWidth="3" strokeLinecap="round"
                  stroke="url(#progressGrad)"
                  strokeDasharray={circumference}
                  strokeDashoffset={progressOffset}
                  className="transition-all duration-700 ease-out"
                />
                <defs>
                  <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute flex flex-col items-center justify-center" style={{ marginTop: '28px' }}>
                <span className="text-2xl font-black text-white">{answeredCount}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">of {totalQuestions}</span>
              </div>
            </div>
          </div>

          {/* Navigation Grid */}
          <div className="rounded-2xl p-5 md:p-6" style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}>
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Navigation</h3>
            <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {test.questions.map((q, i) => {
                const isCurrent = i === currentIdx
                const isAnswered = !!answers[q.id]
                return (
                  <button
                    key={q.id}
                    onClick={() => navigateQuestion(i)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-xs font-black transition-all duration-200 border active:scale-90 ${
                      isCurrent
                        ? "bg-gradient-to-br from-teal-400 to-indigo-500 border-teal-400/40 text-white shadow-lg shadow-teal-500/20 scale-110 z-10"
                        : isAnswered
                          ? "bg-teal-400/10 border-teal-400/20 text-teal-400 hover:bg-teal-400/20"
                          : "bg-white/[0.03] border-white/[0.06] text-slate-600 hover:bg-white/[0.06] hover:text-slate-400"
                    }`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            
            {/* Legend */}
            <div className="mt-5 pt-4 space-y-2.5 border-t border-white/[0.06]">
              <div className="flex items-center space-x-2.5 text-[10px] font-semibold text-slate-500">
                <div className="w-3 h-3 rounded bg-gradient-to-br from-teal-400 to-indigo-500 shadow-sm" />
                <span>Current</span>
              </div>
              <div className="flex items-center space-x-2.5 text-[10px] font-semibold text-slate-500">
                <div className="w-3 h-3 rounded bg-teal-400/20 border border-teal-400/30" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-2.5 text-[10px] font-semibold text-slate-500">
                <div className="w-3 h-3 rounded bg-white/[0.04] border border-white/[0.08]" />
                <span>Not Visited</span>
              </div>
            </div>
          </div>

          {/* Integrity Monitor */}
          <div className="rounded-2xl p-5 md:p-6 border" style={{
            background: isPreview ? 'rgba(251, 191, 36, 0.05)' : 'rgba(16, 185, 129, 0.05)',
            borderColor: isPreview ? 'rgba(251, 191, 36, 0.15)' : 'rgba(16, 185, 129, 0.15)'
          }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className={`w-4 h-4 ${isPreview ? 'text-amber-400' : 'text-emerald-400'}`} />
              <h4 className={`text-[10px] font-black uppercase tracking-widest ${isPreview ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isPreview ? 'Preview Mode' : 'Secure Session'}
              </h4>
            </div>
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed">
              {isPreview && isTeacher 
                ? "Proctoring disabled for teacher preview." 
                : "Do not switch tabs or minimize. Activity is being monitored."}
            </p>
          </div>
        </aside>
      </main>
    </div>
  )
}
