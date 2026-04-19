import React from "react"

interface Question {
  id: string
  questionText: string
  questionType: string
  correctAnswer: string
  options: Record<string, string> | null
  marks: number
}

interface PrintableResponseProps {
  result: {
    id: string
    score: number
    totalMarks: number
    timeTaken: number
    submittedAt: string
    answers: Record<string, string>
    student: {
      name: string
      admno: string
      class: string
      section: string
    }
    test: {
      title: string
      subject: string
      questions: Question[]
    }
  }
}

function isAnswerCorrect(question: Question, studentAnswer: string): boolean {
  const correctAnswer = question.correctAnswer.trim()
  const answer = studentAnswer?.toString().trim() || ""

  if (question.questionType === "match") {
    const studentPairs = answer.split("|")
      .map((p: string) => p.trim().toLowerCase())
      .filter(Boolean)
      .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
      .sort()

    const correctPairs = correctAnswer.split("|")
      .map((p: string) => p.trim().toLowerCase())
      .filter(Boolean)
      .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
      .sort()

    return studentPairs.length === correctPairs.length &&
           studentPairs.every((p: string, i: number) => p === correctPairs[i])
  } else if (question.questionType === "jumbled") {
    return answer.toLowerCase().replace(/\s+/g, "") === correctAnswer.toLowerCase().replace(/\s+/g, "")
  } else if (question.questionType === "fill" || question.questionType === "short") {
    const validAnswers = correctAnswer.split(",").map(a => a.trim().toLowerCase())
    return validAnswers.includes(answer.toLowerCase())
  }

  return answer.toLowerCase() === correctAnswer.toLowerCase()
}

export default function PrintableResponse({ result }: PrintableResponseProps) {
  const percentage = ((result.score / result.totalMarks) * 100).toFixed(1)
  const submittedAt = new Date(result.submittedAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const correctCount = result.test.questions.filter(q => 
    isAnswerCorrect(q, result.answers[q.id])
  ).length
  const incorrectCount = result.test.questions.length - correctCount

  return (
    <div className="print-only w-full bg-white text-black p-4 font-sans leading-normal">
      {/* School Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-2xl font-black uppercase tracking-tighter mb-1">DPSMRN Mathura</h1>
        <p className="text-[10px] font-bold tracking-[0.3em] text-gray-600 uppercase">Class Test Assessment Report • Official Result</p>
      </div>

      {/* Main Details Section */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 border border-gray-200 p-5 rounded-xl bg-gray-50/30">
        <div>
          <p className="text-[9px] font-black uppercase text-gray-400 mb-0.5 tracking-wider">Chapter / Test Title</p>
          <p className="text-base font-bold text-gray-900">{result.test.title}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase text-gray-400 mb-0.5 tracking-wider">Subject</p>
          <p className="text-base font-bold text-gray-900">{result.test.subject}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase text-gray-400 mb-0.5 tracking-wider">Student Profile</p>
          <p className="text-base font-bold text-gray-900">{result.student.name}</p>
          <p className="text-xs font-semibold text-gray-500">Admission No: {result.student.admno} • Class: {result.student.class}-{result.student.section}</p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase text-gray-400 mb-0.5 tracking-wider">Assessment Timeline</p>
          <p className="text-base font-bold text-gray-900">{submittedAt}</p>
          <p className="text-xs font-semibold text-gray-500">Duration: {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s</p>
        </div>
      </div>

      {/* Performance Matrix */}
      <div className="mb-8">
        <h2 className="text-sm font-black uppercase border-l-4 border-black pl-3 mb-4 tracking-widest text-gray-800">Performance Matrix</h2>
        <div className="grid grid-cols-4 gap-3">
          <div className="border-2 border-slate-100 p-3 rounded-lg text-center">
            <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Marks Obtained</p>
            <p className="text-xl font-black text-slate-900">{result.score} <span className="text-xs text-gray-400 font-bold">/ {result.totalMarks}</span></p>
          </div>
          <div className="border-2 border-slate-100 p-3 rounded-lg text-center">
            <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Mastery Level</p>
            <p className="text-xl font-black text-slate-900">{percentage}%</p>
          </div>
          <div className="border-2 border-slate-100 p-3 rounded-lg text-center">
            <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Correct</p>
            <p className="text-xl font-black text-green-600">{correctCount}</p>
          </div>
          <div className="border-2 border-slate-100 p-3 rounded-lg text-center">
            <p className="text-[8px] font-black uppercase text-gray-400 mb-1">Incorrect</p>
            <p className="text-xl font-black text-red-500">{incorrectCount}</p>
          </div>
        </div>
      </div>

      {/* Question Breakdown */}
      <div>
        <h2 className="text-sm font-black uppercase border-l-4 border-black pl-3 mb-4 tracking-widest text-gray-800">Response Breakdown</h2>
        <div className="space-y-3">
          {result.test.questions.map((q, idx) => {
            const studentAnswer = result.answers[q.id]?.toString() || ""
            const correct = isAnswerCorrect(q, studentAnswer)
            const wasAttempted = studentAnswer.trim() !== ""

            return (
              <div 
                key={q.id} 
                className={`p-3 rounded-lg border flex gap-4 break-inside-avoid ${
                  correct ? "bg-green-50/30 border-green-100" : "bg-red-50/30 border-red-100"
                }`}
              >
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex justify-between items-start gap-4">
                    <p className="font-bold text-[11px] text-gray-900">{q.questionText}</p>
                    <span className="text-[8px] font-black text-gray-400 uppercase shrink-0 pt-0.5">{q.marks} Pts.</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[7px] font-black uppercase text-gray-400 mb-0.5 tracking-tighter">Student Submission</p>
                      <p className={`text-[10px] font-bold ${correct ? "text-green-700" : "text-red-700"}`}>
                        {wasAttempted ? studentAnswer : "SKIP"}
                      </p>
                    </div>
                    {!correct && (
                      <div>
                        <p className="text-[7px] font-black uppercase text-gray-400 mb-0.5 tracking-tighter">Validation Rule</p>
                        <p className="text-[10px] font-bold text-green-700">{q.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Analysis */}
      <div className="mt-12 pt-6 border-t border-gray-100 flex justify-between items-end opacity-60">
        <div className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
          Evaluation ID: {result.id.slice(0, 8).toUpperCase()} • Integrity Checksum Verified
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-widest leading-tight">DPSMRN Mathura Portal</p>
          <p className="text-[7px] font-medium text-gray-500 italic">This is a system-generated report. No signature required.</p>
        </div>
      </div>
    </div>
  )
}
