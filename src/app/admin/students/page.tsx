"use client"

import { useEffect, useState, useMemo } from "react"
import toast from "react-hot-toast"
import * as XLSX from "xlsx"
import Card from "@/components/ui/card"

interface Student {
  admno: string
  name: string
  class: string
  section: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [filterClass, setFilterClass] = useState<string>("all")

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
    if (filterClass === "all") return students
    return students.filter(s => s.class === filterClass)
  }, [students, filterClass])

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
          toast.error("Upload failed")
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
    <div className="space-y-6">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
          <p className="text-gray-500">Add, delete or bulk upload students via Excel</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Filter Class</span>
            <select 
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="bg-white border-2 border-gray-100 text-gray-900 font-bold px-4 py-2 rounded-lg focus:outline-none focus:border-teal-500 transition-all cursor-pointer shadow-sm min-w-[150px]"
            >
              <option value="all">All Classes</option>
              {uniqueClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <label className="cursor-pointer bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 mt-4 rounded-lg font-medium transition-colors h-[44px] flex items-center">
            {isUploading ? "Uploading..." : "Bulk Upload Excel"}
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </header>

      <Card title={`Student List (${filteredStudents.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-gray-500 uppercase text-xs">
                <th className="py-3 px-4">Adm No</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">Loading...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-gray-400">No students found. Upload Excel to begin.</td></tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.admno} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{student.admno}</td>
                    <td className="py-3 px-4 text-gray-900 font-semibold">{student.name}</td>
                    <td className="py-3 px-4 text-gray-900">{student.class}</td>
                    <td className="py-3 px-4 text-gray-900">{student.section}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(student.admno)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="Expected Excel Format">
        <p className="text-sm text-gray-600 mb-2">Ensure your Excel sheet has these exact headers in the first row:</p>
        <code className="bg-gray-100 p-2 rounded block text-xs">admno, name, class, section</code>
        <p className="text-xs text-gray-400 mt-2 italic">Supporting both .xlsx and .xls formats.</p>
      </Card>
    </div>
  )
}
