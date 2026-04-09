"use client"

import { useEffect, useState, useMemo } from "react"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"
import Card from "@/components/ui/card"
import { Search } from "lucide-react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"

interface Student {
  admno: string
  name: string
  class: string
  section: string
}

export default function StudentsPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"

  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [filterClass, setFilterClass] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students")
      const data = await res.json()
      setStudents(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  // Derived state: unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classes = students.map(s => s.class)
    return Array.from(new Set(classes)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [students])

  // Derived state: filtered students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = filterClass === "all" || s.class === filterClass
      const searchItems = [s.name, s.admno, s.class].join(" ").toLowerCase()
      const matchesSearch = searchItems.includes(searchQuery.toLowerCase())
      return matchesClass && matchesSearch
    })
  }, [students, filterClass, searchQuery])

  const handleDelete = async (admno: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return

    const res = await fetch(`/api/students?admno=${admno}`, { method: "DELETE" })
    if (res.ok) {
      toast.success("Student deleted")
      fetchStudents()
    } else {
      toast.error("Failed to delete")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const reader = new FileReader()

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary" })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)

        const res = await fetch("/api/students", {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" }
        })

        if (res.ok) {
          toast.success("Bulk upload successful")
          fetchStudents()
        } else {
          const errorData = await res.json()
          toast.error(errorData.message || errorData.error || "Upload failed")
        }
      } catch (err) {
        toast.error("Error reading Excel file")
        console.error(err)
      } finally {
        setIsUploading(false)
        // Reset the input value so the same file can be uploaded again if needed
        if (e.target) e.target.value = ""
      }
    }

    reader.readAsBinaryString(file)
  }

  return (
    <div className="space-y-5">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Manage Students</h1>
          <p className="text-slate-400 text-sm">Add, delete or bulk upload students via Excel</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col gap-1 w-full md:w-64">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Search Students</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Name, Adm No or Class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 text-slate-900 font-bold pl-9 pr-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Filter Class</span>
            <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-white border-2 border-slate-100 text-slate-900 font-bold px-3 py-1.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-sm min-w-[130px]"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 mt-5 rounded-lg font-bold transition-all text-xs flex items-center h-[36px] shadow-lg shadow-slate-200">
              {isUploading ? "Uploading..." : "Bulk Upload Excel"}
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
          )}
        </div>
      </header>

      <Card title={`Student List (${filteredStudents.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Adm No</th>
                <th className="py-2.5 px-3">Name</th>
                <th className="py-2.5 px-3">Class</th>
                <th className="py-2.5 px-3">Section</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">Loading...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">No students found. Upload Excel to begin.</td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.admno} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-700 text-sm">{student.admno}</td>
                    <td className="py-2.5 px-3 text-slate-900 font-semibold text-sm">{student.name}</td>
                    <td className="py-2.5 px-3 text-slate-600 text-sm">{student.class}</td>
                    <td className="py-2.5 px-3 text-slate-600 text-sm">{student.section}</td>
                    <td className="py-2.5 px-3 text-right">
                      {isAdmin ? (
                        <button
                          onClick={() => handleDelete(student.admno)}
                          className="text-red-400 hover:text-red-600 text-xs font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold italic">Read Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Expected Excel Format">
        <p className="text-sm text-slate-500 mb-2">Ensure your Excel sheet has these exact headers in the first row:</p>
        <code className="bg-slate-50 p-2 rounded-lg block text-xs text-slate-700 font-mono">admno, name, class, section</code>
        <p className="text-xs text-slate-400 mt-2 italic">Supporting both .xlsx and .xls formats.</p>
      </Card>
    </div>
  )
}
