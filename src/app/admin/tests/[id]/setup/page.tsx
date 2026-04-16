"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import toast from "react-hot-toast"
import Card from "@/components/ui/card"
import Link from "next/link"

export default function EditTestSetupPage() {
  const params = useParams()
  const testId = params.id as string
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    class: "",
    sections: "",
    duration: 60,
    startTime: "",
    endTime: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const res = await fetch(`/api/tests/${testId}`)
        if (!res.ok) throw new Error("Failed to fetch test")
        const test = await res.json()
        
        // Format dates for datetime-local input
        const formatForInput = (dateString: string | null) => {
          if (!dateString) return ""
          const d = new Date(dateString)
          // Adjust for local timezone offset when converting directly to ISO string slice
          // Using a simpler approach that ignores seconds from the ISO string
          const localTimeStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
          return localTimeStr
        }

        setFormData({
          title: test.title || "",
          subject: test.subject || "",
          class: test.class || "",
          sections: Array.isArray(test.sections) ? test.sections.join(", ") : "",
          duration: test.duration || 60,
          startTime: formatForInput(test.startTime),
          endTime: formatForInput(test.endTime),
        })
      } catch {
        toast.error("Error loading test setup")
      } finally {
        setIsLoading(false)
      }
    }
    fetchTest()
  }, [testId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const res = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      })

      if (res.ok) {
        toast.success("Test setup updated!")
        router.push(`/admin/tests`)
      } else {
        toast.error("Failed to update test setup")
      }
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="max-w-2xl mx-auto py-10 text-center text-gray-500">Loading test data...</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-plus-jakarta text-gray-900 mb-2">Edit Test Information</h1>
          <p className="text-gray-500">Update your test metadata and settings.</p>
        </div>
        <Link 
          href={`/admin/tests/${testId}/edit`}
          className="text-amber-600 hover:text-amber-700 font-semibold text-sm transition-colors"
        >
          &larr; Back to Questions
        </Link>
      </header>

      <Card title="Test Details">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Test Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1 block w-full px-4 py-2 border rounded-md text-gray-900 border-gray-300 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Unit Test 1, Final Exam, etc."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="mt-1 block w-full px-4 py-2 border rounded-md text-gray-900 border-gray-300"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Class</label>
              <input
                type="text"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="mt-1 block w-full px-4 py-2 border rounded-md text-gray-900 border-gray-300"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Sections (e.g. A, B, C)</label>
              <input
                type="text"
                value={formData.sections}
                onChange={(e) => setFormData({ ...formData, sections: e.target.value })}
                className="mt-1 block w-full px-4 py-2 border rounded-md text-gray-900 border-gray-300 focus:ring-amber-500 focus:border-amber-500"
                placeholder="A, B, C"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (Minutes)</label>
              <input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="mt-1 block w-full px-4 py-2 border rounded-md text-gray-900 border-gray-300"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="mt-1 block w-full px-4 py-2 border rounded-md text-gray-900 border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Time</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="mt-1 block w-full px-4 py-2 border rounded-md text-gray-900 border-gray-300"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
             <Link
              href={`/admin/tests`}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
