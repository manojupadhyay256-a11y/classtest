"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import Card from "@/components/ui/card"

export default function CreateTestPage() {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    class: "",
    sections: "",
    duration: 60,
    startTime: "",
    endTime: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/tests", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      })

      if (res.ok) {
        const test = await res.json()
        toast.success("Test metadata saved!")
        router.push(`/admin/tests/${test.id}/edit`)
      } else {
        toast.error("Failed to create test")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold font-plus-jakarta text-gray-900 mb-2">Create New Test</h1>
        <p className="text-gray-500">Define your test settings here. You will add questions on the next step.</p>
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
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
            >
              {isLoading ? "Saving..." : "Save and Add Questions"}
            </button>
          </div>
        </form>
      </Card>
    </div>
  )
}
