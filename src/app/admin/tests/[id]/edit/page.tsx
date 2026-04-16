"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Card from "@/components/ui/card"
import QuestionBuilder from "@/components/ui/question-builder"

interface Question {
  id: string
  questionText: string
  questionType: string
  marks: number
  order: number
}

export default function EditTestPage() {
  const params = useParams()
  const testId = params.id as string
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchQuestions = useCallback(async () => {
    const res = await fetch(`/api/tests/${testId}/questions`)
    const data = await res.json()
    setQuestions(data)
    setIsLoading(false)
  }, [testId])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      fetchQuestions()
    } catch {
      alert("Error deleting question")
    }
  }

  const handleClearAll = async () => {
    if (!confirm("WARNING: This will delete ALL questions in this test. This cannot be undone. Are you sure?")) return
    try {
      const res = await fetch(`/api/tests/${testId}/questions`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to clear")
      fetchQuestions()
    } catch {
      alert("Error clearing test")
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-6">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Edit Test Questions</h1>
              <a href={`/admin/tests/${testId}/setup`} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-full text-xs font-bold uppercase transition-colors">Edit Setup</a>
            </div>
            <p className="text-gray-500">Arrange and manage your test content</p>
          </div>
          {questions.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              <span>Clear Test</span>
            </button>
          )}
        </header>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-gray-400">Loading questions...</p>
          ) : questions.length === 0 ? (
            <Card title="Questions">
              <p className="text-gray-400 py-10 text-center border-2 border-dashed rounded-xl">No questions added yet. Use the builder on the right to start.</p>
            </Card>
          ) : (
            questions.map((q, idx) => (
              <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start space-x-4">
                <span className="bg-gray-100 text-gray-500 font-bold px-3 py-1 rounded text-sm">{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="text-gray-900 font-medium mb-2">{q.questionText}</p>
                    <button 
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-gray-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Delete Question"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                  <div className="flex space-x-4">
                    <span className="text-xs font-bold uppercase text-gray-400 bg-gray-50 px-2 py-1 rounded">{q.questionType}</span>
                    <span className="text-xs font-bold uppercase text-amber-600 bg-amber-50 px-2 py-1 rounded">{q.marks} Marks</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-1 border-l pl-10">
        <div className="sticky top-10">
          <QuestionBuilder 
            testId={testId} 
            fetchQuestions={fetchQuestions} 
            nextOrder={questions.length + 1}
          />
        </div>
      </div>
    </div>
  )
}
