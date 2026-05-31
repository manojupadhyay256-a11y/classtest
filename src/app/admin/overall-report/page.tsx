"use client"

import { useEffect, useState, useMemo } from "react"
import Card from "@/components/ui/card"
import toast from "react-hot-toast"
import { 
  FileBarChart, 
  ChevronDown, 
  CheckSquare, 
  Square, 
  Printer, 
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BarChart3,
  Users,
  Trophy,
  Target
} from "lucide-react"

interface TestOption {
  id: string
  title: string
  subject: string
  class: string
  sections: string[]
  _count: { questions: number; results: number }
}

interface TestInReport {
  id: string
  title: string
  subject: string
  totalMarks: number
}

interface StudentReport {
  admno: string
  name: string
  section: string
  results: Record<string, { score: number; totalMarks: number } | null>
  totalScore: number
  totalPossible: number
  percentage: number
}

interface ReportData {
  tests: TestInReport[]
  students: StudentReport[]
  className: string
}

function getPerformanceColor(percentage: number | null): string {
  if (percentage === null) return "text-slate-400"
  if (percentage >= 80) return "text-emerald-600"
  if (percentage >= 50) return "text-amber-600"
  return "text-rose-600"
}

function getPerformanceBg(percentage: number | null): string {
  if (percentage === null) return "bg-slate-50 border-slate-200"
  if (percentage >= 80) return "bg-emerald-50 border-emerald-200"
  if (percentage >= 50) return "bg-amber-50 border-amber-200"
  return "bg-rose-50 border-rose-200"
}

function getPerformanceLabel(percentage: number | null): string {
  if (percentage === null) return "Not Appeared"
  if (percentage >= 80) return "Strong"
  if (percentage >= 50) return "Average"
  return "Weak"
}

function PerformanceIcon({ percentage }: { percentage: number | null }) {
  if (percentage === null) return <AlertTriangle size={12} className="text-slate-400" />
  if (percentage >= 80) return <TrendingUp size={12} className="text-emerald-600" />
  if (percentage >= 50) return <Minus size={12} className="text-amber-600" />
  return <TrendingDown size={12} className="text-rose-600" />
}

export default function OverallReportPage() {
  // Step 1: Selection state
  const [allTests, setAllTests] = useState<TestOption[]>([])
  const [isLoadingTests, setIsLoadingTests] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set())
  
  // Step 2: Report state
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedSection, setSelectedSection] = useState<string>("All")

  // Fetch all tests
  useEffect(() => {
    fetch("/api/tests")
      .then(res => res.json())
      .then(data => {
        setAllTests(data)
        setIsLoadingTests(false)
      })
      .catch(() => {
        toast.error("Failed to load tests")
        setIsLoadingTests(false)
      })
  }, [])

  // Get unique classes from tests
  const uniqueClasses = useMemo(() => {
    const classes = allTests.map(t => t.class)
    return Array.from(new Set(classes)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [allTests])

  // Tests filtered by selected class
  const classTests = useMemo(() => {
    if (!selectedClass) return []
    return allTests.filter(t => t.class === selectedClass)
  }, [allTests, selectedClass])

  // Reset selections when class changes
  useEffect(() => {
    setSelectedTestIds(new Set())
    setReportData(null)
  }, [selectedClass])

  const toggleTest = (testId: string) => {
    setSelectedTestIds(prev => {
      const next = new Set(prev)
      if (next.has(testId)) {
        next.delete(testId)
      } else {
        next.add(testId)
      }
      return next
    })
  }

  const selectAll = () => {
    if (selectedTestIds.size === classTests.length) {
      setSelectedTestIds(new Set())
    } else {
      setSelectedTestIds(new Set(classTests.map(t => t.id)))
    }
  }

  const generateReport = async () => {
    if (selectedTestIds.size === 0) {
      toast.error("Please select at least one chapter/test")
      return
    }

    setIsGenerating(true)
    setReportData(null)

    try {
      const testIdsStr = Array.from(selectedTestIds).join(",")
      const res = await fetch(`/api/overall-report?class=${encodeURIComponent(selectedClass)}&testIds=${testIdsStr}`)
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to generate report")
      }

      const data: ReportData = await res.json()
      setReportData(data)
      setSelectedSection("All")
      toast.success(`Report generated for ${data.students.length} students across ${data.tests.length} chapters`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate report")
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const exportCSV = () => {
    if (!reportData) return

    const headers = [
      "S.N",
      "Student Name", 
      "Adm No", 
      "Section",
      ...reportData.tests.map(t => `${t.title} (${t.totalMarks})`),
      "Total",
      "Max Marks",
      "%",
      "Status"
    ]

    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      s.name,
      s.admno,
      s.section,
      ...reportData.tests.map(t => {
        const r = s.results[t.id]
        return r ? r.score : "Not Appeared"
      }),
      s.totalScore,
      s.totalPossible,
      s.percentage.toFixed(1),
      getPerformanceLabel(s.percentage)
    ])

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `overall_report_class_${reportData.className}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("CSV Exported successfully")
  }

  // Filter students by section
  const filteredStudents = useMemo(() => {
    if (!reportData) return []
    if (selectedSection === "All") return reportData.students
    return reportData.students.filter(s => s.section === selectedSection)
  }, [reportData, selectedSection])

  // Get available sections from report data
  const availableSections = useMemo(() => {
    if (!reportData) return []
    return Array.from(new Set(reportData.students.map(s => s.section))).sort()
  }, [reportData])

  // Compute summary stats
  const stats = useMemo(() => {
    if (!filteredStudents.length) return null
    const total = filteredStudents.length
    const avgPercentage = filteredStudents.reduce((sum, s) => sum + s.percentage, 0) / total
    const highestStudent = filteredStudents.reduce((prev, curr) => curr.percentage > prev.percentage ? curr : prev)
    const lowestStudent = filteredStudents.reduce((prev, curr) => curr.percentage < prev.percentage ? curr : prev)
    
    // Count how many appeared in all tests
    const testsCount = reportData?.tests.length || 0
    const fullAppearance = filteredStudents.filter(s => {
      const appeared = Object.values(s.results).filter(r => r !== null).length
      return appeared === testsCount
    }).length

    return { total, avgPercentage, highestStudent, lowestStudent, fullAppearance, testsCount }
  }, [filteredStudents, reportData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-indigo-600" />
            Overall Report
          </h1>
          <p className="text-slate-400 text-sm">Multi-chapter consolidated student performance report</p>
        </div>
      </header>

      {/* Step 1: Selection Panel */}
      <Card title="📋 Select Chapters for Report" className="print:hidden">
        <div className="space-y-4">
          {/* Class Selection */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-xs">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">
                Select Class
              </label>
              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 text-slate-900 font-bold px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer appearance-none pr-8"
                >
                  <option value="">Choose a class...</option>
                  {uniqueClasses.map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Test/Chapter Selection */}
          {selectedClass && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Select Chapters / Tests ({selectedTestIds.size}/{classTests.length} selected)
                </label>
                <button
                  onClick={selectAll}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {selectedTestIds.size === classTests.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {isLoadingTests ? (
                <div className="py-6 text-center text-slate-400 text-sm">Loading tests...</div>
              ) : classTests.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-sm">No tests found for Class {selectedClass}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {classTests.map(test => {
                    const isSelected = selectedTestIds.has(test.id)
                    return (
                      <button
                        key={test.id}
                        onClick={() => toggleTest(test.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                          isSelected 
                            ? "border-indigo-500 bg-indigo-50/50 shadow-sm shadow-indigo-100" 
                            : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50"
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-bold truncate ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
                            {test.title}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            {test.subject} · {test._count.questions} Qs · {test._count.results} Submissions
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Generate Button */}
              <div className="pt-2">
                <button
                  onClick={generateReport}
                  disabled={selectedTestIds.size === 0 || isGenerating}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all text-sm shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  {isGenerating ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <FileBarChart className="w-4 h-4" />
                      Generate Report ({selectedTestIds.size} chapter{selectedTestIds.size !== 1 ? "s" : ""})
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Step 2: Report View */}
      {reportData && (
        <>
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section:</span>
              <div className="flex flex-wrap gap-1">
                <button 
                  onClick={() => setSelectedSection("All")}
                  className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                    selectedSection === "All" 
                    ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  All
                </button>
                {availableSections.map(s => (
                  <button 
                    key={s}
                    onClick={() => setSelectedSection(s)}
                    className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                      selectedSection === s 
                      ? "bg-slate-900 text-white shadow-md shadow-slate-200" 
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={exportCSV}
                className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-100"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Report
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4 print:gap-2">
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 print:p-2 print:border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-indigo-500 print:w-3 print:h-3" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Students</span>
                </div>
                <div className="text-2xl font-black text-slate-900 print:text-lg">{stats.total}</div>
                <div className="text-[10px] text-slate-400 font-bold">{stats.fullAppearance} appeared in all</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 print:p-2 print:border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-teal-500 print:w-3 print:h-3" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg %</span>
                </div>
                <div className={`text-2xl font-black print:text-lg ${getPerformanceColor(stats.avgPercentage)}`}>
                  {stats.avgPercentage.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400 font-bold">Across {stats.testsCount} chapters</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 print:p-2 print:border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-amber-500 print:w-3 print:h-3" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Highest</span>
                </div>
                <div className="text-2xl font-black text-emerald-600 print:text-lg">{stats.highestStudent.percentage}%</div>
                <div className="text-[10px] text-slate-400 font-bold truncate">{stats.highestStudent.name}</div>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 print:p-2 print:border-slate-200">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-rose-500 print:w-3 print:h-3" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Lowest</span>
                </div>
                <div className="text-2xl font-black text-rose-600 print:text-lg">{stats.lowestStudent.percentage}%</div>
                <div className="text-[10px] text-slate-400 font-bold truncate">{stats.lowestStudent.name}</div>
              </div>
            </div>
          )}

          {/* Printable Report Header */}
          <div className="hidden print:block text-center mb-4 border-b-2 border-slate-900 pb-3">
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-1">Overall Performance Report</h1>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Class: {reportData.className}</span>
              {selectedSection !== "All" && <span>Section: {selectedSection}</span>}
              <span>Chapters: {reportData.tests.length}</span>
              <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
            </div>
          </div>

          {/* Consolidated Table */}
          <Card title={`📊 Consolidated Results — Class ${reportData.className}${selectedSection !== "All" ? ` (Section ${selectedSection})` : ""}`}>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-[8px] uppercase font-black tracking-widest text-slate-400">
                    <th className="py-3 px-2 w-8 text-center">S.N</th>
                    <th className="py-3 px-2 w-36">Student Name</th>
                    <th className="py-3 px-2 w-16">Adm No</th>
                    <th className="py-3 px-1 w-8 text-center">Sec</th>
                    {reportData.tests.map(test => (
                      <th key={test.id} className="py-3 px-2 text-center min-w-[70px]">
                        <div className="truncate max-w-[80px]" title={test.title}>{test.title}</div>
                        <div className="text-[7px] font-bold text-slate-300 normal-case tracking-normal mt-0.5">
                          ({test.totalMarks}M)
                        </div>
                      </th>
                    ))}
                    <th className="py-3 px-2 text-center w-16 bg-slate-50">Total</th>
                    <th className="py-3 px-2 text-center w-14 bg-slate-50">%</th>
                    <th className="py-3 px-2 text-center w-20 bg-slate-50 print:hidden">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={reportData.tests.length + 6} className="py-8 text-center text-slate-400 text-sm italic">
                        No students found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, idx) => (
                      <tr key={student.admno} className="hover:bg-slate-50/50 transition-colors text-[11px]">
                        <td className="py-2 px-2 text-center text-slate-300 font-bold">{idx + 1}</td>
                        <td className="py-2 px-2 font-bold text-slate-900 uppercase truncate max-w-[140px]">{student.name}</td>
                        <td className="py-2 px-2 font-mono text-slate-400 text-[10px]">{student.admno}</td>
                        <td className="py-2 px-1 text-center font-bold text-slate-500">{student.section}</td>
                        {reportData.tests.map(test => {
                          const result = student.results[test.id]
                          if (result) {
                            const pct = (result.score / result.totalMarks) * 100
                            return (
                              <td key={test.id} className="py-2 px-2 text-center">
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-black ${getPerformanceBg(pct)} ${getPerformanceColor(pct)}`}>
                                  <PerformanceIcon percentage={pct} />
                                  {result.score}/{result.totalMarks}
                                </div>
                              </td>
                            )
                          } else {
                            return (
                              <td key={test.id} className="py-2 px-2 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-wider">
                                  <AlertTriangle size={10} />
                                  N/A
                                </span>
                              </td>
                            )
                          }
                        })}
                        <td className="py-2 px-2 text-center font-black text-slate-900 bg-slate-50/50">
                          {student.totalScore}/{student.totalPossible}
                        </td>
                        <td className={`py-2 px-2 text-center font-black bg-slate-50/50 ${getPerformanceColor(student.percentage)}`}>
                          {student.percentage}%
                        </td>
                        <td className="py-2 px-2 text-center bg-slate-50/50 print:hidden">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${getPerformanceBg(student.percentage)} ${getPerformanceColor(student.percentage)}`}>
                            <PerformanceIcon percentage={student.percentage} />
                            {getPerformanceLabel(student.percentage)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Chapter-wise Analysis */}
          {reportData.tests.length > 1 && (
            <Card title="📈 Chapter-wise Analysis">
              <div className="space-y-3">
                {reportData.tests.map(test => {
                  const studentsWithResult = filteredStudents.filter(s => s.results[test.id] !== null)
                  const studentsAbsent = filteredStudents.filter(s => s.results[test.id] === null)
                  const avgScore = studentsWithResult.length > 0
                    ? studentsWithResult.reduce((sum, s) => sum + (s.results[test.id]?.score || 0), 0) / studentsWithResult.length
                    : 0
                  const avgPct = test.totalMarks > 0 ? (avgScore / test.totalMarks) * 100 : 0
                  const strong = studentsWithResult.filter(s => {
                    const r = s.results[test.id]
                    return r && (r.score / r.totalMarks) * 100 >= 80
                  }).length
                  const weak = studentsWithResult.filter(s => {
                    const r = s.results[test.id]
                    return r && (r.score / r.totalMarks) * 100 < 50
                  }).length

                  return (
                    <div key={test.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-slate-50/60 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm truncate">{test.title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {test.subject} · Max: {test.totalMarks} marks
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <div className={`text-xs font-black ${getPerformanceColor(avgPct)}`}>{avgPct.toFixed(1)}% avg</div>
                          </div>
                          <div className="flex gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-200 bg-emerald-50 text-[9px] font-black text-emerald-600">
                              <TrendingUp size={10} /> {strong} Strong
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-rose-200 bg-rose-50 text-[9px] font-black text-rose-600">
                              <TrendingDown size={10} /> {weak} Weak
                            </span>
                            {studentsAbsent.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[9px] font-black text-slate-400">
                                <AlertTriangle size={10} /> {studentsAbsent.length} Absent
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-700 ${
                            avgPct >= 80 ? "bg-emerald-500" : avgPct >= 50 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${avgPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 px-1 print:px-0">
            <span className="uppercase tracking-widest">Legend:</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border border-emerald-200 bg-emerald-50" /> ≥80% Strong
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border border-amber-200 bg-amber-50" /> 50-79% Average
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border border-rose-200 bg-rose-50" /> &lt;50% Weak
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded border border-slate-200 bg-slate-50" /> Not Appeared
            </span>
          </div>

          {/* Print footer */}
          <div className="hidden print:flex flex-col gap-6 mt-8">
            <div className="flex justify-end items-end">
              <div className="flex flex-col items-center gap-1">
                <img src="/sign.jpg" alt="Subject Teacher Signature" className="h-16 w-auto object-contain" />
                <div className="w-48 border-b border-slate-300"></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Subject Teacher&apos;s Signature</span>
              </div>
            </div>
            <div className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] text-center border-t border-slate-100 pt-4">
              Generated via ClassTest Management System • {new Date().toLocaleString()}
            </div>
          </div>
        </>
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            overflow: visible !important;
          }
          .min-h-screen {
            min-height: auto !important;
            padding: 0 !important;
          }
          .max-w-6xl {
            max-width: 100% !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:flex {
            display: flex !important;
          }
          .print\\:grid-cols-4 {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          @page {
            margin: 0.8cm;
            size: landscape;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
          }
          table {
            font-size: 9px !important;
          }
        }
      `}</style>
    </div>
  )
}
