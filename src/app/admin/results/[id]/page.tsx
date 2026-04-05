"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Card from "@/components/ui/card"
import toast from "react-hot-toast"

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
}

export default function AdminResultsPage() {
  const params = useParams()
  const id = params.id as string
  const [results, setResults] = useState<Result[]>([])
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchResults = async () => {
      const res = await fetch(`/api/results/${id}`)
      const data = await res.json()
      setResults(data.results || [])
      setTestInfo(data.test)
      setIsLoading(false)
    }
    fetchResults()
  }, [id])

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

  const avgScore = results.length > 0 
    ? (results.reduce((acc, r) => acc + r.score, 0) / results.length).toFixed(1) 
    : 0

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{testInfo?.title || "Test Results"}</h1>
          <p className="text-gray-500">{testInfo?.subject} • Class {results[0]?.student.class || "-"}</p>
        </div>
        <button 
          onClick={exportCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
        >
          📥 Export CSV
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-400 uppercase text-xs font-black tracking-widest">
                <th className="py-4 px-4">Student</th>
                <th className="py-4 px-4">Adm No</th>
                <th className="py-4 px-4">Score</th>
                <th className="py-4 px-4">%</th>
                <th className="py-4 px-4 text-right">Time Taken</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={5} className="py-10 text-center">Loading results...</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">No submissions found.</td></tr>
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
