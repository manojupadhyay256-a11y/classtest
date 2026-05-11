"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Card from "@/components/ui/card"
import QuestionBuilder from "@/components/ui/question-builder"
import toast from "react-hot-toast"

interface Question {
  id: string
  questionText: string
  questionType: string
  marks: number
  order: number
  correctAnswer: string
  options?: Record<string, string>
}

export default function EditTestPage() {
  const params = useParams()
  const testId = params.id as string
  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<Question> | null>(null)

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

  const startEditing = (q: Question) => {
    setEditingId(q.id)
    setEditFormData({
      questionText: q.questionText,
      questionType: q.questionType,
      marks: q.marks,
      correctAnswer: q.correctAnswer,
      options: q.options
    })
  }

  const handleUpdateQuestion = async (id: string) => {
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(editFormData),
        headers: { "Content-Type": "application/json" }
      })
      if (!res.ok) throw new Error("Update failed")
      toast.success("Question updated!")
      setEditingId(null)
      fetchQuestions()
    } catch {
      toast.error("Error updating question")
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pb-20">
      <div className="lg:col-span-2 space-y-6">
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Edit Questions</h1>
              <a href={`/admin/tests/${testId}/setup`} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors">Edit Setup</a>
            </div>
            <p className="text-gray-500 text-sm">Manage test content and marking scheme</p>
          </div>
          {questions.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1-2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              <span>Clear All</span>
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
              <div key={q.id} className={`bg-white rounded-xl shadow-sm border transition-all ${editingId === q.id ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-100'}`}>
                {editingId === q.id && editFormData ? (
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded text-sm">Editing Question {idx + 1}</span>
                      <div className="flex space-x-2">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1 text-gray-500 hover:text-gray-700 font-bold text-xs">Cancel</button>
                        <button onClick={() => handleUpdateQuestion(q.id)} className="bg-amber-600 text-white px-4 py-1 rounded-lg font-bold text-xs hover:bg-amber-700">Save Changes</button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Type</label>
                        <select 
                          value={editFormData.questionType}
                          onChange={(e) => setEditFormData({...editFormData, questionType: e.target.value})}
                          className="w-full border rounded-lg p-2 text-sm text-gray-900"
                        >
                          <option value="mcq">MCQ</option>
                          <option value="truefalse">True/False</option>
                          <option value="fill">Fill in Blank</option>
                          <option value="jumbled">Jumbled</option>
                          <option value="match">Match</option>
                          <option value="short">Short Answer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Marks</label>
                        <input 
                          type="number"
                          value={editFormData.marks}
                          onChange={(e) => setEditFormData({...editFormData, marks: parseInt(e.target.value)})}
                          className="w-full border rounded-lg p-2 text-sm text-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Question Text</label>
                      <textarea 
                        value={editFormData.questionText}
                        onChange={(e) => setEditFormData({...editFormData, questionText: e.target.value})}
                        className="w-full border rounded-lg p-2 text-sm text-gray-900 min-h-[80px]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Correct Answer / Keys</label>
                      <input 
                        type="text"
                        value={editFormData.correctAnswer}
                        onChange={(e) => setEditFormData({...editFormData, correctAnswer: e.target.value})}
                        className="w-full border rounded-lg p-2 text-sm text-gray-900 font-mono"
                        placeholder="Comma separated for multiple correct answers"
                      />
                    </div>

                    {editFormData.questionType === 'mcq' && editFormData.options && (
                      <div className="pt-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">MCQ Options</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(editFormData.options as Record<string, string>).map(([key, val]) => (
                            <div key={key} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                              <span className="uppercase font-bold text-gray-400 text-xs w-4">{key}</span>
                              <input 
                                type="text"
                                value={val}
                                onChange={(e) => setEditFormData({
                                  ...editFormData, 
                                  options: { ...editFormData.options, [key]: e.target.value }
                                })}
                                className="bg-transparent flex-1 text-xs text-gray-900 border-none p-0 focus:ring-0"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 flex items-start space-x-4">
                    <span className="bg-gray-100 text-gray-500 font-bold px-3 py-1 rounded text-sm">{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="pr-4">
                          <p className="text-gray-900 font-medium mb-2 leading-relaxed">{q.questionText}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">{q.questionType}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">{q.marks} Marks</span>
                            <span className="text-[10px] font-bold tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100 truncate max-w-[200px]">Ans: {q.correctAnswer}</span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button 
                            onClick={() => startEditing(q)}
                            className="text-gray-400 hover:text-amber-600 p-2 rounded-lg hover:bg-amber-50 transition-colors"
                            title="Edit Question"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="text-gray-400 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete Question"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-1 border-l pl-0 lg:pl-10 mt-10 lg:mt-0">
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
