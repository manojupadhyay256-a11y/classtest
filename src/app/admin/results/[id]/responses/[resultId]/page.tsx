"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Card from "@/components/ui/card"

interface Question {
  id: string
  questionText: string
  questionType: string
  correctAnswer: string
  options: Record<string, string> | null
  marks: number
  order: number
}

interface StudentResult {
  id: string
  admno: string
  score: number
  totalMarks: number
  timeTaken: number
  submittedAt: string
  answers: Record<string, string>
  student: {
    name: string
    admno: string
    class: string
    section: string
  }
  test: {
    id: string
    title: string
    subject: string
    questions: Question[]
  }
}

function isAnswerCorrect(question: Question, studentAnswer: string): boolean {
  const correctAnswer = question.correctAnswer.trim()
  const answer = studentAnswer?.toString().trim() || ""

  if (question.questionType === "match") {
    const studentPairs = answer.split("|")
      .map((p: string) => p.trim().toLowerCase())
      .filter(Boolean)
      .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
      .sort()

    const correctPairs = correctAnswer.split("|")
      .map((p: string) => p.trim().toLowerCase())
      .filter(Boolean)
      .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
      .sort()

    return studentPairs.length === correctPairs.length &&
           studentPairs.every((p: string, i: number) => p === correctPairs[i])
  }

  return answer.toLowerCase() === correctAnswer.toLowerCase()
}

export default function AdminViewStudentResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.id as string
  const resultId = params.resultId as string
  const [result, setResult] = useState<StudentResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/results/${testId}/responses/${resultId}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Failed to fetch result")
        }
        const data = await res.json()
        setResult(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setIsLoading(false)
      }
    }
    fetchResult()
  }, [testId, resultId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 font-semibold">Loading student responses...</p>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-500 font-bold">{error || "Result not found"}</p>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors"
          >
            ← Go back
          </button>
        </div>
      </div>
    )
  }

  const percentage = ((result.score / result.totalMarks) * 100).toFixed(1)
  const correctCount = result.test.questions.filter(q => 
    isAnswerCorrect(q, result.answers[q.id])
  ).length
  const incorrectCount = result.test.questions.length - correctCount
  const unattempted = result.test.questions.filter(q => 
    !result.answers[q.id] || result.answers[q.id].toString().trim() === ""
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <button
            onClick={() => router.push(`/admin/results/${testId}`)}
            className="text-blue-600 hover:text-blue-800 font-bold text-sm mb-2 flex items-center gap-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Results
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Student Responses</h1>
          <p className="text-gray-500 mt-1">{result.test.title} • {result.test.subject}</p>
        </div>
      </header>

      {/* Student Info Card */}
      <Card title="Student Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Name</p>
            <p className="font-bold text-gray-900 text-lg">{result.student.name}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Admission No</p>
            <p className="font-mono font-bold text-gray-700">{result.student.admno}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Class & Section</p>
            <p className="font-bold text-gray-700">{result.student.class} - {result.student.section}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Time Taken</p>
            <p className="font-bold text-gray-700">{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Submitted</p>
            <p className="font-bold text-gray-700 text-sm">{new Date(result.submittedAt).toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Score Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card title="Score">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-blue-600">{result.score}</span>
            <span className="text-lg font-bold text-gray-300">/ {result.totalMarks}</span>
          </div>
        </Card>
        <Card title="Percentage">
          <div className="text-3xl font-black text-teal-600">{percentage}%</div>
        </Card>
        <Card title="Correct">
          <div className="text-3xl font-black text-green-600">{correctCount}</div>
        </Card>
        <Card title="Incorrect">
          <div className="text-3xl font-black text-red-500">{incorrectCount - unattempted} 
            {unattempted > 0 && <span className="text-lg text-gray-400 ml-1">(+{unattempted} skipped)</span>}
          </div>
        </Card>
      </div>

      {/* Question-by-Question Breakdown */}
      <Card title="Question-by-Question Breakdown">
        <div className="space-y-6">
          {result.test.questions.map((q, idx) => {
            const studentAnswer = result.answers[q.id]?.toString().trim() || ""
            const correct = isAnswerCorrect(q, studentAnswer)
            const wasAttempted = studentAnswer !== ""

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border-2 transition-all ${
                  !wasAttempted
                    ? "border-gray-200 bg-gray-50"
                    : correct
                    ? "border-green-200 bg-green-50/50"
                    : "border-red-200 bg-red-50/50"
                }`}
              >
                {/* Question Header */}
                <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                      !wasAttempted
                        ? "bg-gray-200 text-gray-500"
                        : correct
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-[15px] leading-relaxed">{q.questionText}</h3>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 py-0.5 bg-gray-100 rounded-md">
                          {q.questionType}
                        </span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          {q.marks} {q.marks === 1 ? "mark" : "marks"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                    !wasAttempted
                      ? "bg-gray-200 text-gray-500"
                      : correct
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {!wasAttempted ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        Skipped
                      </>
                    ) : correct ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Correct
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Incorrect
                      </>
                    )}
                  </div>
                </div>

                {/* MCQ Options Display */}
                {q.questionType === "mcq" && q.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 sm:ml-12">
                    {Object.entries(q.options as Record<string, string>).map(([key, value]) => {
                      const isStudentSelection = studentAnswer.toLowerCase() === key.toLowerCase()
                      const isCorrectOption = q.correctAnswer.trim().toLowerCase() === key.toLowerCase()

                      return (
                        <div
                          key={key}
                          className={`px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                            isCorrectOption && isStudentSelection
                              ? "border-green-400 bg-green-50 text-green-800"
                              : isStudentSelection && !isCorrectOption
                              ? "border-red-400 bg-red-50 text-red-800"
                              : isCorrectOption
                              ? "border-green-300 bg-green-50/50 text-green-700"
                              : "border-gray-200 bg-white text-gray-600"
                          }`}
                        >
                          <span className="font-black mr-2 uppercase">{key}.</span>
                          {value}
                          {isStudentSelection && (
                            <span className="ml-2 text-[10px] font-black uppercase tracking-widest">
                              ← Student&apos;s Answer
                            </span>
                          )}
                          {isCorrectOption && !isStudentSelection && (
                            <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-green-600">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Non-MCQ Answers Display */}
                {q.questionType !== "mcq" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 sm:ml-12">
                    <div className={`p-4 rounded-xl border ${
                      !wasAttempted
                        ? "border-gray-200 bg-gray-50"
                        : correct
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Student&apos;s Answer</p>
                      <p className={`font-bold text-sm ${
                        !wasAttempted ? "text-gray-400 italic" : correct ? "text-green-700" : "text-red-700"
                      }`}>
                        {wasAttempted ? studentAnswer : "Not attempted"}
                      </p>
                    </div>
                    {!correct && (
                      <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Correct Answer</p>
                        <p className="font-bold text-sm text-green-700">{q.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
