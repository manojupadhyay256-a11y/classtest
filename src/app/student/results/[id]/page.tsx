"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

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

  if (isLoading || !result) return <div className="p-10 text-center font-bold text-teal-600">Loading Result Breakdown...</div>

  const percentage = ((result.score / result.totalMarks) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="flex justify-between items-center bg-white p-10 rounded-3xl shadow-xl shadow-teal-700/5">
          <div className="space-y-1">
             <h1 className="text-3xl font-black text-gray-900 leading-tight">{result.test.title}</h1>
             <p className="text-teal-600 font-bold uppercase tracking-widest text-sm">{result.test.subject}</p>
          </div>
          <div className="text-right">
             <div className="text-5xl font-black text-teal-600 leading-none">{result.score} <span className="text-lg font-bold text-gray-300">/ {result.totalMarks}</span></div>
             <div className="mt-2 inline-block px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-black uppercase">{percentage}% Score</div>
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">Your Answer Sheet</h2>
            {result.test.isResultsHidden && (
              <span className="flex items-center space-x-2 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                <span>Restricted Access</span>
              </span>
            )}
          </div>

          {result.test.isResultsHidden ? (
            <div className="relative group overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 opacity-[0.03]"></div>
               <div className="bg-white border-2 border-amber-100 p-12 rounded-[2.5rem] text-center shadow-xl shadow-amber-900/5 relative z-10">
                  <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-amber-500 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight leading-none uppercase">Analysis Not Yet Ready</h3>
                  <p className="text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                    Detailed answer review and correct explanations will be unlocked once the teacher deactivates this test session.
                  </p>
                  <div className="mt-8 inline-flex items-center space-x-4">
                     <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Status</span>
                        <div className="px-3 py-1 bg-teal-50 text-teal-600 rounded-lg text-xs font-black">Score Released</div>
                     </div>
                     <div className="w-px h-8 bg-slate-100"></div>
                     <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Review</span>
                        <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black">Pending Closure</div>
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-4">
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
              } else {
                isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase()
              }

              return (
                <div key={q.id} className={`bg-white p-8 rounded-2xl border-2 transition-all ${isCorrect ? "border-green-100" : "border-red-100"}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-start space-x-4">
                       <span className="bg-gray-100 text-gray-500 font-black px-3 py-1 rounded text-sm">{idx + 1}</span>
                       <h3 className="text-xl font-bold text-gray-900 pt-1 leading-snug">{q.questionText}</h3>
                    </div>
                    {isCorrect ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <span className="text-2xl">❌</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-xl border ${isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                      <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Your Answer</p>
                      <p className={`font-black text-lg ${isCorrect ? "text-green-700" : "text-red-700"}`}>{studentAnswer || "No Answer"}</p>
                    </div>
                    {!isCorrect && (
                      <div className="p-4 rounded-xl border bg-teal-50 border-teal-200">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-1 tracking-widest">Correct Answer</p>
                        <p className="font-black text-lg text-teal-800">{q.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
              })}
            </div>
          )}
        </section>

        <footer className="text-center pt-10">
          <Link href="/student/dashboard" className="text-teal-600 font-bold hover:underline text-lg">
             ← Back to My Dashboard
          </Link>
        </footer>
      </div>
    </div>
  )
}
