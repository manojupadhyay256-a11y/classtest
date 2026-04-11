import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface Question {
  id: string
  questionText: string
  questionType: string
  correctAnswer: string
  marks: number
}

interface TestPreviewSummaryProps {
  test: {
    title: string
    questions: Question[]
  }
  answers: Record<string, string>
  onClose: () => void
}

export default function TestPreviewSummary({ test, answers, onClose }: TestPreviewSummaryProps) {
  let totalMarks = 0
  let obtainedMarks = 0

  const processedQuestions = test.questions.map(q => {
    const studentAnswer = (answers[q.id] || "").toString().trim()
    const correctAnswer = q.correctAnswer.trim()
    
    let isCorrect = false
    if (q.questionType === "match") {
      const studentPairs = studentAnswer.split("|")
        .map(p => p.trim().toLowerCase())
        .filter(Boolean)
        .map(p => p.split(":").map(part => part.trim()).join(":"))
        .sort()
      const correctPairs = correctAnswer.split("|")
        .map(p => p.trim().toLowerCase())
        .filter(Boolean)
        .map(p => p.split(":").map(part => part.trim()).join(":"))
        .sort()
      isCorrect = studentPairs.length === correctPairs.length && studentPairs.every((p, i) => p === correctPairs[i])
    } else if (q.questionType === "jumbled") {
      isCorrect = studentAnswer.toLowerCase().replace(/\s+/g, "") === correctAnswer.toLowerCase().replace(/\s+/g, "")
    } else {
      isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase()
    }

    if (isCorrect) obtainedMarks += q.marks
    totalMarks += q.marks

    return { ...q, studentAnswer, isCorrect }
  })

  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in slide-in-from-bottom-8 duration-500">
        <header className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Preview Results</h2>
            <p className="text-slate-500 font-medium">Verify your test logic for: {test.title}</p>
          </div>
          <div className="text-right">
             <div className="text-3xl font-black text-teal-600">{obtainedMarks} / {totalMarks}</div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Score</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             <div className="bg-teal-50 p-6 rounded-3xl border border-teal-100">
                <p className="text-xs font-black text-teal-600 uppercase tracking-widest mb-1">Accuracy</p>
                <p className="text-2xl font-black text-teal-900">{percentage.toFixed(1)}%</p>
             </div>
             <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">Questions</p>
                <p className="text-2xl font-black text-indigo-900">{test.questions.length}</p>
             </div>
             <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">Mode</p>
                <p className="text-2xl font-black text-amber-900">Teacher Preview</p>
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Detailed Breakdown</h3>
            {processedQuestions.map((q, idx) => (
              <div key={q.id} className={`p-6 rounded-3xl border-2 transition-all ${q.isCorrect ? "bg-white border-teal-100 items-start" : "bg-rose-50/30 border-rose-100"}`}>
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-xl flex-shrink-0 ${q.isCorrect ? "bg-teal-100 text-teal-600" : "bg-rose-100 text-rose-600"}`}>
                    {q.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-slate-800">Q{idx + 1}: {q.questionText}</p>
                      <span className="text-xs font-black text-slate-400 uppercase">{q.marks}M</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-white rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marked Answer</p>
                        <p className={`font-bold ${q.isCorrect ? "text-teal-600" : "text-rose-600"}`}>
                          {q.studentAnswer || <span className="italic opacity-50">Not Attempted</span>}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Correct Answer</p>
                        <p className="font-bold text-slate-700">{q.correctAnswer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="p-8 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center space-x-3 text-amber-600 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 max-w-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-bold leading-tight underline decoration-amber-200 decoration-2 underline-offset-4">
              Results from this preview session are NOT saved to the database and will not affect student analytics.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-full md:w-auto px-12 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            Close Preview
          </button>
        </footer>
      </div>
    </div>
  )
}
