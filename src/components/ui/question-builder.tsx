"use client"

import { useState } from "react"
import toast from "react-hot-toast"

interface QuestionBuilderProps {
  testId: string
  fetchQuestions: () => void
  nextOrder: number
}

export default function QuestionBuilder({ testId, fetchQuestions, nextOrder }: QuestionBuilderProps) {
  const [type, setType] = useState("mcq")
  const [questionText, setQuestionText] = useState("")
  const [marks, setMarks] = useState(1)
  const [mcqOptions, setMcqOptions] = useState<Record<string, string>>({ a: "", b: "", c: "", d: "" })
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  const handleSave = async () => {
    if (!questionText || !correctAnswer) {
      toast.error("Please fill all required fields")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/tests/${testId}/questions`, {
        method: "POST",
        body: JSON.stringify({
          questionText,
          questionType: type,
          marks,
          order: nextOrder,
          correctAnswer: type === "match" 
            ? correctAnswer.split("\n").map(line => line.trim()).filter(Boolean).map(line => {
                const [l, r] = line.split(":");
                return `${l?.trim()}:${r?.trim()}`;
              }).join("|")
            : correctAnswer,
          options: type === "mcq" 
            ? mcqOptions 
            : type === "jumbled" 
              ? { tokens: correctAnswer.includes(" ") ? correctAnswer.split(" ").sort(() => Math.random() - 0.5) : correctAnswer.split("").sort(() => Math.random() - 0.5) }
              : type === "match" 
                ? {
                    left: correctAnswer.split("\n").map(line => line.split(":")[0]?.trim()).filter(Boolean),
                    right: correctAnswer.split("\n").map(line => line.split(":")[1]?.trim()).filter(Boolean).sort(() => Math.random() - 0.5)
                  }
                : null
        }),
        headers: { "Content-Type": "application/json" }
      })

      if (res.ok) {
        toast.success("Question added!")
        setQuestionText("")
        setCorrectAnswer("")
        fetchQuestions()
      } else {
        toast.error("Failed to add question")
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch(`/api/tests/${testId}/questions/import`, {
        method: "POST",
        body: formData,
      })

      if (res.ok) {
        toast.success("Questions imported successfully!")
        fetchQuestions()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to import questions")
      }
    } catch {
      toast.error("An error occurred during import")
    } finally {
      setIsImporting(false)
      e.target.value = "" // Reset file input
    }
  }

  return (
    <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900">Add New Question</h3>
        <div>
          <input 
            type="file" 
            accept=".docx" 
            id="word-import" 
            className="hidden" 
            onChange={handleImport}
          />
          <button 
            onClick={() => document.getElementById("word-import")?.click()}
            disabled={isImporting}
            className="text-xs bg-teal-600 text-white px-3 py-2 rounded-md font-bold hover:bg-teal-700 transition-colors flex items-center space-x-1"
          >
            {isImporting ? "Importing..." : "Bulk Import (.docx)"}
          </button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Type</label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full border rounded-md p-2 text-gray-900"
            >
              <option value="mcq">Multiple Choice</option>
              <option value="truefalse">True / False</option>
              <option value="fill">Fill in the Blank</option>
              <option value="jumbled">Jumbled Word</option>
              <option value="match">Match the Following</option>
              <option value="short">Short Answer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Marks</label>
            <input 
              type="number" 
              value={marks} 
              onChange={(e) => setMarks(parseInt(e.target.value))}
              className="mt-1 block w-full border rounded-md p-2 text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase">Question Text</label>
          <textarea 
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="mt-1 block w-full border rounded-md p-2 text-gray-900 h-20"
            placeholder="Enter your question here..."
          />
        </div>

        {type === "mcq" && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase">Options</label>
            {["a", "b", "c", "d"].map((opt) => (
              <div key={opt} className="flex items-center space-x-2">
                <span className="uppercase font-bold text-gray-400">{opt}</span>
                <input 
                  type="text" 
                  value={mcqOptions[opt]}
                  onChange={(e) => setMcqOptions({ ...mcqOptions, [opt]: e.target.value })}
                  className="flex-1 border rounded-md p-2 text-sm text-gray-900"
                />
                <input 
                  type="radio" 
                  name="correct" 
                  onChange={() => setCorrectAnswer(opt)}
                  checked={correctAnswer === opt}
                />
              </div>
            ))}
          </div>
        )}

        {type === "truefalse" && (
          <div className="flex space-x-4">
            <button 
              onClick={() => setCorrectAnswer("true")}
              className={`px-4 py-2 rounded-md font-bold ${correctAnswer === "true" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"}`}
            >
              TRUE
            </button>
            <button 
              onClick={() => setCorrectAnswer("false")}
              className={`px-4 py-2 rounded-md font-bold ${correctAnswer === "false" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-600"}`}
            >
              FALSE
            </button>
          </div>
        )}

        {type === "jumbled" && (
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-500 uppercase">Correct Sentence/Word</label>
            <input 
              type="text" 
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full border rounded-md p-2 text-gray-900"
              placeholder="e.g. The quick brown fox"
            />
            <p className="text-[10px] text-gray-400">Tokens will be automatically created by splitting by spaces (or letters for single words).</p>
          </div>
        )}

        {type === "match" && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-gray-500 uppercase">Match Pairs</label>
            <div className="space-y-2">
               <p className="text-[10px] text-gray-400 mb-2">Enter pairs like &apos;Country:Capital&apos; one per line.</p>
               <textarea 
                 className="w-full border rounded-md p-2 text-gray-900 h-24 font-mono text-sm"
                 placeholder="France:Paris&#10;Japan:Tokyo&#10;India:Delhi"
                 onChange={(e) => setCorrectAnswer(e.target.value)}
                 value={correctAnswer}
               />
            </div>
          </div>
        )}

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold hover:bg-black transition-colors"
        >
          {isSaving ? "Saving..." : "Add to Test"}
        </button>
      </div>
    </div>
  )
}
