"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Timer, ChevronLeft, ChevronRight, CheckCircle2, Flag, X, ArrowRight } from "lucide-react"

interface Question {
  id: string
  questionText: string
  questionType: string
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
  const testId = params.id as string
  const [test, setTest] = useState<Test | null>(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Local state for interactive questions
  const [matchSelection, setMatchSelection] = useState<string | null>(null)

  const fetchTest = useCallback(async () => {
    try {
      const res = await fetch(`/api/student/test/${testId}`)
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
        router.push("/student/dashboard")
        return
      }
      setTest(data)
      setTimeLeft(data.duration * 60)
      setIsLoading(false)
    } catch {
      toast.error("Failed to load test")
      router.push("/student/dashboard")
    }
  }, [testId, router])

  useEffect(() => {
    fetchTest()
  }, [fetchTest])

  const submitTest = useCallback(async () => {
    if (isSubmitting) return
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
  }, [testId, answers, timeLeft, test?.duration, router, isSubmitting])

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
        <h2 className="text-2xl font-black text-slate-800 animate-pulse">Synchronizing Examination Data...</h2>
        <p className="text-slate-500 font-medium mt-2">Preparing your secure environment</p>
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
      <nav className="glass sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center border-b border-white/40 gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-slate-900 rounded-2xl shadow-lg shadow-slate-900/10">
            <Timer className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900">{test.title}</h1>
            <div className="flex items-center space-x-3 mt-0.5">
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100 flex items-center">
                <span className="w-1.5 h-1.5 bg-teal-500 rounded-full mr-1.5 animate-pulse" />
                Live Session
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {answeredCount} of {test.questions.length} Attempted
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className={`flex items-center space-x-3 px-6 py-3 rounded-2xl font-mono text-2xl font-black shadow-inner transition-all ${
            timeLeft < 300 
            ? "bg-red-50 text-red-600 border border-red-100 animate-pulse" 
            : "bg-slate-900 text-white"
          }`}>
            <span className="text-sm font-bold uppercase tracking-widest opacity-60 mr-2">Ends in</span>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
          </div>
          
          <button 
            onClick={submitTest}
            className="hidden md:flex bg-teal-600 hover:bg-teal-700 text-white font-black px-8 py-3 rounded-2xl shadow-xl shadow-teal-700/20 transition-all active:scale-95 items-center space-x-2"
          >
            <CheckCircle2 className="w-5 h-5" />
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

      <main className="max-w-7xl mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="glass p-6 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-teal-500" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <span className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Question {currentIdx + 1}</span>
              <div className="flex items-center space-x-2">
                 <span className="bg-amber-50 text-amber-600 text-xs font-black px-3 py-1.5 rounded-xl border border-amber-100 uppercase tracking-wider">
                   {currentQ!.marks} Marks Value
                 </span>
                 <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                   <Flag className="w-5 h-5" />
                 </button>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-12">
              {currentQ!.questionText}
            </h2>

            <div className="space-y-6">
              {currentQ!.questionType === "mcq" && currentQ!.options && (
                <div className="grid grid-cols-1 gap-4">
                  {(["a","b","c","d"] as const).filter(key => currentQ!.options && (currentQ!.options as Record<string,string>)[key]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setAnswers({ ...answers, [currentQ!.id]: key })}
                      className={`group w-full text-left p-4 md:p-6 rounded-3xl border-2 transition-all flex items-center space-x-4 md:space-x-6 relative overflow-hidden ${
                        answers[currentQ!.id] === key 
                        ? "bg-slate-900 text-white border-slate-900 shadow-2xl shadow-slate-900/20" 
                        : "bg-white/50 text-slate-700 border-slate-200/60 hover:border-teal-400 hover:bg-white shadow-sm"
                      }`}
                    >
                      <span className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-2xl flex items-center justify-center font-black text-lg md:text-xl transition-colors ${
                        answers[currentQ!.id] === key 
                        ? "bg-white/10 text-white" 
                        : "bg-slate-100 text-slate-400 group-hover:bg-teal-50 group-hover:text-teal-600"
                      }`}>
                        {key.toUpperCase()}
                      </span>
                      <span className="font-bold text-base md:text-lg break-words flex-1">{(currentQ!.options as Record<string,string>)[key]}</span>
                      {answers[currentQ!.id] === key && (
                        <div className="absolute right-4 md:right-6">
                           <div className="w-6 h-6 md:w-8 md:h-8 bg-teal-500 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                             <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
                           </div>
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
                      className={`group relative overflow-hidden py-10 rounded-[2rem] border-2 text-3xl font-black uppercase transition-all shadow-xl ${
                        answers[currentQ!.id] === opt
                        ? opt === "true" 
                          ? "bg-teal-600 border-teal-600 text-white shadow-teal-600/30" 
                          : "bg-rose-600 border-rose-600 text-white shadow-rose-600/30"
                        : "bg-white/50 border-slate-100 text-slate-300 hover:border-teal-200 hover:text-slate-400"
                      }`}
                    >
                      {opt}
                      {answers[currentQ!.id] === opt && (
                        <div className="absolute top-4 right-4">
                           <CheckCircle2 className="w-8 h-8 opacity-40 shadow-none" />
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
                    className="w-full p-8 text-2xl font-bold rounded-[2rem] border-2 bg-white/50 border-slate-100 text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-8 focus:ring-teal-500/5 transition-all outline-none shadow-sm"
                  />
                  {answers[currentQ!.id] && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2">
                       <CheckCircle2 className="w-8 h-8 text-teal-500" />
                    </div>
                  )}
                </div>
              )}

              {currentQ!.questionType === "jumbled" && (
                <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="p-8 min-h-[120px] rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-center relative">
                    {(answers[currentQ!.id] || "").split(" ").filter(t => t).map((token, i) => (
                      <button
                        key={`${token}-${i}`}
                        onClick={() => handleJumbledClick(token, false)}
                        className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-all flex items-center hover:bg-red-600 group"
                      >
                        {token}
                        <X className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                    {!(answers[currentQ!.id]) && (
                       <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Tap tiles below to build answer</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center">
                    {availableJumbledTokens.map((token, i) => (
                      <button
                        key={`${token}-${i}`}
                        onClick={() => handleJumbledClick(token, true)}
                        className="bg-white border-2 border-slate-200 px-6 py-3 rounded-2xl font-black text-slate-700 hover:border-teal-500 hover:text-teal-600 hover:shadow-md transition-all active:scale-95 shadow-sm"
                      >
                        {token}
                      </button>
                    ))}
                  </div>

                  <div className="pt-8 border-t border-slate-100/80">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Prefer using a keyboard?</p>
                     <input 
                        type="text"
                        value={answers[currentQ!.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [currentQ!.id]: e.target.value })}
                        placeholder="Type your answer directly here..."
                        className="w-full text-center p-6 text-xl font-bold rounded-2xl border-2 bg-white/50 border-slate-200 text-slate-900 focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all outline-none"
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
                           className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-bold flex justify-between items-center ${
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
                           className={`w-full text-left p-6 rounded-2xl border-2 transition-all font-bold group ${
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

            <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-4 md:gap-6 pt-10 mt-12 border-t-2 border-slate-100">
              <button 
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(currentIdx - 1)}
                className="w-full sm:w-auto px-6 md:px-10 py-4 md:py-5 rounded-2xl font-black text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-400 hover:bg-slate-50 disabled:opacity-30 disabled:hover:border-slate-200 transition-all flex items-center justify-center space-x-2 group active:scale-95 shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span>Previous</span>
              </button>
              
              <div className="hidden xl:flex space-x-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-100/50">
                {test.questions.map((__, i) => (
                  <div key={__.id} className={`w-2.5 h-2.5 rounded-full transition-all duration-500 shadow-sm ${i === currentIdx ? "w-8 bg-teal-500" : "bg-slate-300"}`} />
                ))}
              </div>

              {isLast ? (
                <button 
                    onClick={submitTest}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-10 md:px-16 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-700 text-white font-black text-lg md:text-xl transition-all shadow-xl hover:shadow-2xl hover:shadow-teal-600/30 hover:scale-105 active:scale-95 disabled:grayscale"
                >
                    {isSubmitting ? "Finalising..." : "Confirm & Submit"}
                </button>
              ) : (
                <button 
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-black text-base md:text-lg transition-all shadow-xl hover:shadow-2xl hover:shadow-indigo-600/30 hover:-translate-y-1 active:scale-95 flex items-center justify-center space-x-3 group"
                >
                  <span>Save & Continue</span>
                  <ChevronRight className="w-5 md:w-6 h-5 md:h-6 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>

        <aside className="lg:col-span-1 space-y-6">
          <div className="glass p-8 rounded-[2rem] shadow-xl">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Exam Navigation</h3>
            <div className="grid grid-cols-4 gap-3">
              {test.questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`aspect-square rounded-xl flex items-center justify-center text-sm font-black transition-all border-2 ${
                    i === currentIdx
                    ? "bg-teal-500 border-teal-500 text-white shadow-lg shadow-teal-500/30 scale-110 z-10"
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
               Secure browser monitoring is active. Do not switch tabs or minimize this window during the examination.
             </p>
          </div>
        </aside>
      </main>
    </div>
  )
}
