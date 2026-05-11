"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Card from "@/components/ui/card"
import toast from "react-hot-toast"
import { useSession } from "next-auth/react"

interface Result {
  id: string
  score: number
  totalMarks: number
  timeTaken: number
  submittedAt: string
  student: {
    name: string
    admno: string
    class: string
    section: string
  }
}

interface TestInfo {
  title: string
  subject: string
  class: string
  section: string
  sections: string[]
}

interface RegradeDetail {
  admno: string
  studentName: string
  oldScore: number
  newScore: number
  totalMarks: number
  changes: {
    questionOrder: number
    questionText: string
    studentAnswer: string
    correctAnswer: string
    aiVerdict: string
    marksAwarded: number
  }[]
}

interface RegradeResponse {
  message: string
  checked: number
  updated: number
  details: RegradeDetail[]
}

export default function AdminResultsPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  const id = params.id as string
  const [results, setResults] = useState<Result[]>([])
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegrading, setIsRegrading] = useState(false)
  const [regradeResult, setRegradeResult] = useState<RegradeResponse | null>(null)
  const [showRegradeDetails, setShowRegradeDetails] = useState(false)

  const fetchResults = useCallback(async () => {
    const res = await fetch(`/api/results/${id}`)
    const data = await res.json()
    setResults(data.results || [])
    setTestInfo(data.test)
    setIsLoading(false)
  }, [id])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const exportCSV = () => {
    if (results.length === 0) return
    
    const headers = ["Admission No", "Student Name", "Class", "Section", "Score", "Total Marks", "%", "Time Taken (s)", "Submitted At"]
    const rows = results.map(r => [
      r.student.admno,
      r.student.name,
      r.student.class,
      r.student.section,
      r.score,
      r.totalMarks,
      ((r.score / r.totalMarks) * 100).toFixed(2),
      r.timeTaken,
      new Date(r.submittedAt).toLocaleString()
    ])

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `results_${testInfo?.title || "test"}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV Exported successfully")
  }

  const deleteResult = async (resultId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}'s submission? This will allow them to retake the test.`)) return;

    const loadingToast = toast.loading("Deleting submission...");
    try {
      const res = await fetch(`/api/results/${id}?resultId=${resultId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete result");
      
      toast.success("Submission deleted successfully", { id: loadingToast });
      setResults(results.filter((r) => r.id !== resultId));
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete submission", { id: loadingToast });
    }
  }

  const handleRegrade = async () => {
    if (!confirm("This will use AI to re-evaluate fill-in-the-blank and short answer questions. Scores can only increase, never decrease. Continue?")) return;

    setIsRegrading(true)
    setRegradeResult(null)
    const loadingToast = toast.loading("🤖 AI is regrading answers... This may take a moment.")

    try {
      const res = await fetch(`/api/results/${id}/regrade`, {
        method: "POST",
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Regrade failed")
      }

      const data: RegradeResponse = await res.json()
      setRegradeResult(data)
      
      if (data.updated > 0) {
        toast.success(`${data.message}`, { id: loadingToast, duration: 5000 })
        // Refresh results to show updated scores
        fetchResults()
      } else {
        toast.success("All scores are already correct — no changes needed.", { id: loadingToast, duration: 5000 })
      }
    } catch (error) {
      console.error("Regrade error:", error)
      toast.error(error instanceof Error ? error.message : "Regrade failed", { id: loadingToast })
    } finally {
      setIsRegrading(false)
    }
  }

  const avgScore = results.length > 0 
    ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1) 
    : 0

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-10">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">{testInfo?.title || "Test Results"}</h1>
          <p className="text-gray-500 text-sm">{testInfo?.subject} • Class {results[0]?.student.class || "-"}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isAdmin && (
            <button 
              onClick={handleRegrade}
              disabled={isRegrading || results.length === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-bold transition-colors text-sm w-full sm:w-auto text-center flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegrading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Regrading...
                </>
              ) : (
                <>🤖 AI Regrade</>
              )}
            </button>
          )}
          <button 
            onClick={() => router.push(`/admin/results/${id}/report`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-bold transition-colors text-sm w-full sm:w-auto text-center flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Printable Report
          </button>
          <button 
            onClick={exportCSV}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-bold transition-colors text-sm w-full sm:w-auto text-center"
          >
            📥 Export CSV
          </button>
        </div>
      </header>

      {/* Regrade Results Summary */}
      {regradeResult && regradeResult.updated > 0 && (
        <Card title="🤖 AI Regrade Results">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-gray-900">{regradeResult.message}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Checked {regradeResult.checked} submissions · {regradeResult.updated} scores updated
                </p>
              </div>
              <button
                onClick={() => setShowRegradeDetails(!showRegradeDetails)}
                className="text-purple-600 hover:text-purple-700 text-xs font-bold transition-colors"
              >
                {showRegradeDetails ? "Hide Details" : "Show Details"}
              </button>
            </div>

            {showRegradeDetails && (
              <div className="space-y-3 mt-3 pt-3 border-t border-slate-100">
                {regradeResult.details.map((detail, idx) => (
                  <div key={idx} className="bg-purple-50/50 rounded-xl p-3 border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-gray-900 text-sm">{detail.studentName}</span>
                        <span className="text-xs text-gray-400 ml-2">({detail.admno})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-red-400 line-through mr-2">{detail.oldScore}/{detail.totalMarks}</span>
                        <span className="text-sm font-black text-green-600">{detail.newScore}/{detail.totalMarks}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {detail.changes.map((change, cIdx) => (
                        <div key={cIdx} className="text-xs bg-white rounded-lg p-2 border border-purple-50">
                          <p className="font-bold text-gray-700">Q{change.questionOrder}: {change.questionText}</p>
                          <p className="text-gray-500 mt-0.5">
                            Student: <span className="font-medium text-gray-700">&quot;{change.studentAnswer}&quot;</span>
                            {" · "}
                            Expected: <span className="font-medium text-gray-700">&quot;{change.correctAnswer}&quot;</span>
                          </p>
                          <p className="text-green-600 font-medium mt-0.5">
                            ✓ AI: {change.aiVerdict} (+{change.marksAwarded} mark{change.marksAwarded > 1 ? "s" : ""})
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card title="Avg Score">
          <div className="text-3xl font-black text-blue-600">{avgScore}</div>
        </Card>
        <Card title="Submissions">
          <div className="text-3xl font-black text-teal-600">{results.length}</div>
        </Card>
        <Card title="Highest Score">
          <div className="text-3xl font-black text-amber-600">{results.length > 0 ? Math.max(...results.map(r => r.score)) : 0}</div>
        </Card>
      </div>

      <Card title="Student Submissions">
        {/* Mobile Card View */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            <div className="py-10 text-center text-slate-400 text-sm">Loading results...</div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">No submissions found.</div>
          ) : (
            results.map((result) => (
              <div key={result.id} className="p-4 bg-slate-50/60 rounded-xl border border-slate-100 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{result.student.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {result.student.admno} · {result.student.class}-{result.student.section}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-lg text-teal-600">{result.score}</span>
                      <span className="text-xs font-bold text-gray-300">/ {result.totalMarks}</span>
                    </div>
                    <div className="text-[10px] font-black text-gray-400">{((result.score/result.totalMarks)*100).toFixed(0)}%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400">
                    {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => router.push(`/admin/results/${id}/responses/${result.id}`)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View student responses"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => deleteResult(result.id, result.student.name)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete submission and allow retake"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-400 uppercase text-xs font-black tracking-widest">
                <th className="py-4 px-4">Student</th>
                <th className="py-4 px-4">Adm No</th>
                <th className="py-4 px-4">Score</th>
                <th className="py-4 px-4">%</th>
                <th className="py-4 px-4 text-right">Time Taken</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={6} className="py-10 text-center">Loading results...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-gray-400">No submissions found.</td></tr>
              ) : (
                results.map((result) => (
                  <tr key={result.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-900">{result.student.name}</div>
                      <div className="text-xs text-gray-400 font-semibold uppercase">{result.student.class} - {result.student.section}</div>
                    </td>
                    <td className="py-4 px-4 font-mono text-gray-500">{result.student.admno}</td>
                    <td className="py-4 px-4">
                      <span className="font-black text-lg text-teal-600">{result.score}</span>
                      <span className="text-sm font-bold text-gray-300"> / {result.totalMarks}</span>
                    </td>
                    <td className="py-4 px-4">
                       <div className="w-16 bg-gray-100 h-2 rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-teal-500" style={{ width: `${(result.score/result.totalMarks)*100}%` }}></div>
                       </div>
                       <div className="text-[10px] font-black text-gray-400">{((result.score/result.totalMarks)*100).toFixed(0)}%</div>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-400">{Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => router.push(`/admin/results/${id}/responses/${result.id}`)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View student responses"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => deleteResult(result.id, result.student.name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete submission and allow retake"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
