"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Printer, ChevronLeft } from "lucide-react"

interface Student {
  admno: string
  name: string
  class: string
  section: string
}

interface Result {
  admno: string
  score: number
  totalMarks: number
  submittedAt: string
}

interface TestInfo {
  title: string
  subject: string
  class: string
  sections: string[]
}

export default function PrintableReportPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const [data, setData] = useState<{
    test: TestInfo
    allStudents: Student[]
    results: Result[]
  } | null>(null)
  
  const [selectedSection, setSelectedSection] = useState<string>("All")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/results/${id}`)
        if (!res.ok) throw new Error("Failed to fetch")
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) return <div className="p-10 text-center font-bold">Loading Report...</div>
  if (!data) return <div className="p-10 text-center font-bold text-red-500">Error loading data</div>

  const { test, allStudents, results } = data
  
  // Group students by section
  const availableSections = Array.from(new Set(allStudents.map(s => s.section))).sort()
  const displaySections = selectedSection === "All" ? availableSections : [selectedSection]
  
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 max-w-5xl mx-auto printable-area">
      {/* Controls - Hidden in print */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-sm transition-all">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
          
          <div className="flex items-center gap-2">
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
        </div>
        
        <button 
          onClick={handlePrint}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 w-full md:w-auto"
        >
          <Printer className="w-4 h-4" />
          Print Report
        </button>
      </div>

      {/* Report Container */}
      <div className="print:m-0">
        {/* Report Header */}
        <div className="text-center mb-6 border-b-2 border-slate-900 pb-4">
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-1 leading-tight">{test.title}</h1>
          <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            <span>Subject: {test.subject}</span>
            <span>Class: {test.class}</span>
            <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        {/* Section Wise Reports */}
        {displaySections.map((section, idx) => {
          const sectionStudents = allStudents.filter(s => s.section === section)
          
          return (
            <div key={section} className={`mb-8 ${idx > 0 && selectedSection === "All" ? "page-break-before" : ""}`}>
              <div className="bg-slate-50 px-3 py-1.5 mb-3 border-l-[3px] border-slate-900 flex justify-between items-center">
                <h2 className="text-sm font-black uppercase text-slate-900 tracking-wide">Section {section}</h2>
                <span className="text-[10px] font-bold text-slate-400">{sectionStudents.length} Students</span>
              </div>
              
              <div className="overflow-hidden border border-slate-200 rounded-lg shadow-sm">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[9px] uppercase font-black tracking-widest text-slate-400">
                      <th className="py-2.5 px-3 w-10 text-center">S.N</th>
                      <th className="py-2.5 px-3 w-40">Student Name</th>
                      <th className="py-2.5 px-3 w-20">Adm No</th>
                      <th className="py-2.5 px-2 text-center w-16">Marks</th>
                      <th className="py-2.5 px-2 text-center w-16">Max</th>
                      <th className="py-2.5 px-2 text-center w-16">%</th>
                      <th className="py-2.5 px-3 text-right w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sectionStudents.length === 0 ? (
                      <tr><td colSpan={7} className="py-4 px-4 text-center text-slate-400 italic text-xs">No students found.</td></tr>
                    ) : (
                      sectionStudents.map((student, index) => {
                        const result = results.find(r => r.admno === student.admno)
                        const percentage = result ? ((result.score / result.totalMarks) * 100).toFixed(1) : null
                        
                        return (
                          <tr key={student.admno} className="text-[11px] font-medium text-slate-700 hover:bg-slate-50/50 transition-colors">
                            <td className="py-2 px-3 text-slate-300 text-center">{index + 1}</td>
                            <td className="py-2 px-3 font-bold text-slate-900 uppercase truncate">{student.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-400">{student.admno}</td>
                            <td className="py-2 px-2 text-center font-black text-slate-900">
                              {result ? result.score : "-"}
                            </td>
                            <td className="py-2 px-2 text-center text-slate-400 italic">
                              {result ? result.totalMarks : "-"}
                            </td>
                            <td className="py-2 px-2 text-center font-bold text-slate-600">
                              {percentage ? `${percentage}%` : "-"}
                            </td>
                            <td className="py-2 px-3 text-right whitespace-nowrap">
                              {result ? (
                                <span className="text-teal-600 font-bold uppercase text-[8px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100/50">Completed</span>
                              ) : (
                                <span className="text-rose-500 font-black uppercase text-[8px] bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100/50">Test Not Given</span>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}

        {/* Footer for print */}
        <div className="hidden print:flex flex-col gap-8 mt-10">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <div className="w-48 border-b border-slate-300"></div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Class Teacher&apos;s Signature</span>
            </div>
            <div className="flex flex-col gap-1">
              <div className="w-48 border-b border-slate-300"></div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Principal&apos;s Signature</span>
            </div>
          </div>
          <div className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em] text-center border-t border-slate-100 pt-4">
            Generated via ClassTest Management System • {new Date().toLocaleString()}
          </div>
        </div>
      </div>

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
          .max-w-5xl {
            max-width: 100% !important;
          }
          .printable-area {
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            margin: 1.2cm;
            size: auto;
          }
          .page-break-before {
            page-break-before: always;
            margin-top: 1cm;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  )
}
