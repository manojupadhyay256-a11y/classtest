"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import toast from "react-hot-toast"
import { Timer, ChevronLeft, ChevronRight, CheckCircle2, Flag, X, ArrowRight, Eye } from "lucide-react"
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

  // Local state for interactive questions
  const [matchSelection, setMatchSelection] = useState<string | null>(null)

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

  const availableJumbledTokens = useMemo(() => {
    if (!currentQ || currentQ.questionType !== "jumbled") return []
    const allTokens = [...(currentQ.options?.tokens || [])]
    const selectedTokens = (answers[currentQ.id] || "").split(" ").filter(Boolean)
    
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

  if (isLoading || !test) {
    return (
      <div className="min-h-screen bg-mesh flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-2xl font-black text-slate-800 animate-pulse">Synchronizing Class Test Data...</h2>
        <p className="text-slate-500 font-medium mt-2">Preparing your secure environment</p>
      </div>
    )
  }

  if (!test.questions || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-mesh flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-slate-800">This test has no questions.</h2>
        <p className="text-slate-500 font-medium mt-2">Please contact your administrator.</p>
        <button 
          onClick={() => router.push(isTeacher ? "/admin/tests" : "/student/dashboard")}
          className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const isLast = currentIdx === test.questions.length - 1
  const progress = ((currentIdx + 1) / test.questions.length) * 100
  const answeredCount = Object.keys(answers).length

  const handleJumbledClick = (token: string, isFromPool: boolean) => {
    if (!currentQ) return
    const currentAnswer = answers[currentQ.id] || ""
    const selectedTokens = currentAnswer ? currentAnswer.split(" ") : []
    
    if (isFromPool) {
      const newAnswer = [...selectedTokens, token].join(" ")
      setAnswers({ ...answers, [currentQ.id]: newAnswer })
    } else {
      const firstOccurrenceIdx = selectedTokens.indexOf(token)
      if (firstOccurrenceIdx !== -1) {
        selectedTokens.splice(firstOccurrenceIdx, 1)
        const newAnswer = selectedTokens.join(" ")
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

  return (
    <div className="min-h-screen bg-mesh text-slate-900 font-sans">
      {showPreviewSummary && isTeacher && (
        <TestPreviewSummary 
          test={test} 
          answers={answers} 
          onClose={() => setShowPreviewSummary(false)} 
        />
      )}

      <nav className="glass sticky top-0 z-50 px-3 md:px-4 py-1.5 md:py-2.5 flex flex-col md:flex-row justify-between items-center border-b border-white/40 gap-2 md:gap-4">
        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="p-1.5 md:p-2 bg-slate-900 rounded-lg md:rounded-xl shadow-lg shadow-slate-900/10">
            <Timer className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">{test.title}</h1>
            <div className="flex items-center space-x-2 mt-0.5">
              {isPreview && isTeacher ? (
                <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-100 flex items-center">
                  <Eye className="w-2.5 h-2.5 mr-1" />
                  Teacher Preview
                </span>
              ) : (
                <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-1.5 py-0.5 rounded-full border border-teal-100 flex items-center">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1 animate-pulse" />
                  Live Session
                </span>
              )}
              <span className="text-[10px] font-semibold text-slate-400">
                {answeredCount}/{test.questions.length} Attempted
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4">
          <div className={`flex items-center space-x-1.5 md:space-x-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl font-mono text-lg md:text-xl font-black shadow-inner transition-all ${
            timeLeft < 300 
            ? "bg-red-50 text-red-600 border border-red-100 animate-pulse" 
            : "bg-slate-900 text-white"
          }`}>
            <span className="text-[9px] md:text-xs font-bold uppercase tracking-widest opacity-60 mr-1">Ends in</span>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </div>
          
          <button 
            onClick={submitTest}
            className="hidden md:flex bg-teal-600 hover:bg-teal-700 text-white font-black px-5 py-2 rounded-xl shadow-xl shadow-teal-700/20 transition-all active:scale-95 items-center space-x-2 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Finish Test</span>
          </button>
        </div>
      </nav>

      <div className="w-full h-1.5 bg-slate-200/50 relative">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 to-indigo-600 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(20,184,166,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="max-w-6xl mx-auto p-3 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="lg:col-span-3 space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="glass p-4 md:p-8 rounded-[1.2rem] md:rounded-[1.8rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-teal-500" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Question {currentIdx + 1}</span>
              <div className="flex items-center space-x-2">
                 <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-2 py-1 rounded-lg border border-amber-100 uppercase tracking-wider">
                   {currentQ!.marks} Marks
                 </span>
                 <button className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors">
                   <Flag className="w-4 h-4" />
                 </button>
              </div>
            </div>

            <h2 className="text-lg md:text-2xl font-bold text-slate-900 leading-tight mb-4 md:mb-6">
              {currentQ ? currentQ.questionText : "Loading question..."}
            </h2>

            {isPreview && isTeacher && (
              <div className="mb-10 bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] animate-in slide-in-from-top-4 duration-500">
                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Teacher Reference</p>
                 <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-500">Correct Answer:</span>
                    <span className="text-lg font-black text-slate-900 select-all">{currentQ?.correctAnswer}</span>
                 </div>
              </div>
            )}

            <div className="space-y-6">
              {currentQ?.questionType === "mcq" && currentQ?.options && (
                <div className="grid grid-cols-1 gap-4">
                  {(["a","b","c","d"] as const).filter(key => currentQ?.options && (currentQ?.options as Record<string,string>)[key]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setAnswers({ ...answers, [currentQ!.id]: key })}
                      className={`group w-full text-left p-2.5 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all flex items-center space-x-3 md:space-x-4 relative overflow-hidden ${
                        answers[currentQ!.id] === key 
                        ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                        : isPreview && isTeacher && currentQ!.correctAnswer === key
                          ? "bg-teal-50 border-teal-200 text-teal-900 shadow-sm"
                          : "bg-white/50 text-slate-700 border-slate-200/60 hover:border-teal-400 hover:bg-white shadow-sm"
                      }`}
                    >
                      <span className={`w-7 h-7 md:w-9 md:h-9 flex-shrink-0 rounded-lg md:rounded-xl flex items-center justify-center font-black text-xs md:text-base transition-colors ${
                        answers[currentQ!.id] === key 
                        ? "bg-white/10 text-white" 
                        : isPreview && isTeacher && currentQ!.correctAnswer === key
                          ? "bg-teal-200 text-teal-700"
                          : "bg-slate-100 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600"
                      }`}>
                        {key.toUpperCase()}
                      </span>
                      <span className="font-bold text-sm md:text-base break-words flex-1">{(currentQ!.options as Record<string,string>)[key]}</span>
                      {answers[currentQ!.id] === key && (
                        <div className="absolute right-3 md:right-4">
                           <div className="w-5 h-5 md:w-6 md:h-6 bg-teal-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                             <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
                           </div>
                        </div>
                      )}
                      {isPreview && isTeacher && currentQ.correctAnswer === key && answers[currentQ!.id] !== key && (
                         <div className="absolute right-4 md:right-6 text-teal-500 font-black text-[10px] uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full border border-teal-100">
                           Correct
                         </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {currentQ!.questionType === "truefalse" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {["true", "false"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setAnswers({ ...answers, [currentQ!.id]: opt })}
                      className={`group relative overflow-hidden py-4 md:py-6 rounded-xl md:rounded-2xl border-2 text-xl md:text-2xl font-black uppercase transition-all shadow-md ${
                        answers[currentQ!.id] === opt
                        ? opt === "true" 
                          ? "bg-teal-600 border-teal-600 text-white shadow-teal-600/30" 
                          : "bg-rose-600 border-rose-600 text-white shadow-rose-600/30"
                        : isPreview && isTeacher && currentQ!.correctAnswer === opt
                          ? "bg-teal-50 border-teal-400 text-teal-600"
                          : "bg-white/50 border-slate-100 text-slate-300 hover:border-teal-200 hover:text-slate-400"
                      }`}
                    >
                      {opt}
                      {answers[currentQ!.id] === opt && (
                        <div className="absolute top-3 right-3">
                           <CheckCircle2 className="w-6 h-6 opacity-40 shadow-none" />
                        </div>
                      )}
                      {isPreview && isTeacher && currentQ!.correctAnswer === opt && (
                         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-black tracking-widest text-teal-600">
                           {answers[currentQ!.id] === opt ? "" : "Correct Choice"}
                         </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {(currentQ!.questionType === "fill" || currentQ!.questionType === "short") && (
                <div className="relative">
                  <input 
                    type="text"
                    value={answers[currentQ!.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [currentQ!.id]: e.target.value })}
                    placeholder="Enter your response here..."
                    className="w-full p-4 md:p-6 text-base md:text-lg font-bold rounded-xl md:rounded-2xl border-2 bg-white/50 border-slate-100 text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/5 transition-all outline-none shadow-sm"
                  />
                  {answers[currentQ!.id] && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                       <CheckCircle2 className="w-6 h-6 text-teal-500" />
                    </div>
                  )}
                </div>
              )}

              {currentQ!.questionType === "jumbled" && (
                <div className="space-y-4 md:space-y-6 animate-in fade-in zoom-in duration-500">
                  <div className="p-4 md:p-6 min-h-[80px] rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-wrap gap-2 items-center justify-center relative transition-all">
                    {(answers[currentQ!.id] || "").split(" ").filter(t => t).map((token, i) => (
                      <button
                        key={`${token}-${i}`}
                        onClick={() => handleJumbledClick(token, false)}
                        className="bg-slate-900 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-bold shadow-md shadow-slate-900/10 active:scale-95 transition-all flex items-center hover:bg-red-600 group text-xs md:text-sm"
                      >
                        {token}
                        <X className="w-3 h-3 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                    {!(answers[currentQ!.id]) && (
                       <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tap tiles to build answer</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {availableJumbledTokens.map((token, i) => (
                      <button
                        key={`${token}-${i}`}
                        onClick={() => handleJumbledClick(token, true)}
                        className="bg-white border-2 border-slate-200 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl font-black text-slate-700 hover:border-teal-500 hover:text-teal-600 transition-all active:scale-95 shadow-sm text-xs md:text-sm"
                      >
                        {token}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                     <input 
                        type="text"
                        value={answers[currentQ!.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [currentQ!.id]: e.target.value })}
                        placeholder="Or type answer directly..."
                        className="w-full text-center p-3 md:p-4 text-base md:text-lg font-bold rounded-xl border-2 bg-white/50 border-slate-200 text-slate-900 focus:bg-white focus:border-teal-500 transition-all outline-none shadow-sm"
                      />
                  </div>
                </div>
              )}

              {currentQ!.questionType === "match" && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-4">
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Column A</h3>
                       {(currentQ!.options?.left || []).map((item: string) => (
                         <button
                           key={item}
                           onClick={() => handleMatchClick(item, true)}
                           className={`w-full text-left p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all font-bold flex justify-between items-center text-sm md:text-base ${
                             matchMapping[item] 
                               ? "bg-teal-50 border-teal-200 text-teal-800" 
                               : matchSelection === item
                                 ? "bg-slate-900 border-slate-900 text-white shadow-xl"
                                 : "bg-white/50 border-slate-100 text-slate-600 hover:border-teal-400"
                           }`}
                         >
                           {item}
                           {matchMapping[item] && <ArrowRight className="w-5 h-5 opacity-40" />}
                         </button>
                       ))}
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Column B</h3>
                       {(currentQ!.options?.right || []).map((item: string) => (
                          <button
                            key={item}
                            onClick={() => handleMatchClick(item, false)}
                            className={`w-full text-left p-4 md:p-6 rounded-xl md:rounded-2xl border-2 transition-all font-bold group text-sm md:text-base ${
                              Object.values(matchMapping).includes(item)
                                ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                                : "bg-white/50 border-slate-100 text-slate-600 hover:border-indigo-400"
                            }`}
                          >
                           <div className="flex justify-between items-center">
                              {item}
                              {Object.entries(matchMapping).some(([, v]) => v === item) && (
                                <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-indigo-200 text-indigo-600 uppercase font-black tracking-tighter">
                                  Matched
                                </span>
                              )}
                           </div>
                         </button>
                       ))}
                    </div>
                 </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 md:pt-6 mt-6 md:mt-8 border-t border-slate-100 gap-4">
              <button 
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(currentIdx - 1)}
                className="px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-black text-slate-700 bg-white border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-30 transition-all flex items-center justify-center space-x-2 group active:scale-95 shadow-sm text-sm"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>Previous</span>
              </button>

              {isLast ? (
                <button 
                    onClick={submitTest}
                    disabled={isSubmitting}
                    className="px-6 md:px-10 py-2.5 md:py-3.5 rounded-lg md:rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 text-white font-black text-sm md:text-base transition-all shadow-lg hover:shadow-xl hover:shadow-teal-600/30 hover:scale-105 active:scale-95 disabled:grayscale"
                >
                    {isSubmitting ? "Finalising..." : isPreview && isTeacher ? "Results" : "Submit Test"}
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="px-5 md:px-8 py-2.5 md:py-3.5 rounded-lg md:rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-black text-sm md:text-base transition-all shadow-lg hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-1 active:scale-95 flex items-center justify-center space-x-2 group"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 md:w-5 h-4 md:h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1 space-y-6">
          <div className="glass p-5 md:p-6 rounded-[1.2rem] shadow-lg">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Exam Navigation</h3>
            <div className="grid grid-cols-5 md:grid-cols-4 gap-2">
              {test.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-black transition-all border-2 ${
                    i === currentIdx
                    ? "bg-teal-500 border-teal-500 text-white shadow-md shadow-teal-500/30 scale-105 z-10"
                    : answers[q.id]
                      ? "bg-teal-50 border-teal-200 text-teal-600"
                      : "bg-white border-slate-100 text-slate-300 hover:border-slate-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <div className="mt-8 space-y-4 pt-6 border-t border-slate-200/50">
               <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
                 <span>Status Legend</span>
               </div>
               <div className="flex items-center space-x-3 text-xs font-bold text-slate-600">
                 <div className="w-3 h-3 rounded-full bg-teal-500" />
                 <span>Current</span>
               </div>
               <div className="flex items-center space-x-3 text-xs font-bold text-slate-600">
                 <div className="w-3 h-3 rounded-full bg-teal-50" />
                 <span>Attempted</span>
               </div>
               <div className="flex items-center space-x-3 text-xs font-bold text-slate-600">
                 <div className="w-3 h-3 rounded-full bg-white border border-slate-200" />
                 <span>Not Visited</span>
               </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600/10 to-indigo-900/10 p-8 rounded-[2rem] border border-indigo-100/50">
             <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Integrity Monitor</h4>
             <p className="text-xs font-medium text-slate-500 leading-relaxed">
               {isPreview && isTeacher 
                 ? "Integrity monitoring is disabled for teacher preview mode." 
                 : "Secure browser monitoring is active. Do not switch tabs or minimize this window during the class test."}
             </p>
          </div>
        </aside>
      </main>
    </div>
  )
}
