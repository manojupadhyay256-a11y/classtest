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
          <h2 className="text-2xl font-bold text-gray-800">Your Answer Sheet</h2>
          <div className="space-y-4">
            {result.test.questions.map((q, idx) => {
              const studentAnswer = result.answers[q.id]
              const isCorrect = studentAnswer === q.correctAnswer

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
