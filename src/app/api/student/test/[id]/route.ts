import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isStudent = session.user.role === "STUDENT"

  const test = await prisma.test.findFirst({
    where: { 
      id: params.id, 
      ...(isStudent ? { isActive: true } : {}) 
    },
    include: { questions: { orderBy: { order: "asc" } } }
  })

  if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 })

  if (isStudent) {
    // Check if already attempted
    const student = await prisma.student.findUnique({ where: { admno: session.user.email! } })
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

    const result = await prisma.result.findFirst({
      where: { testId: test.id, admno: student.admno }
    })

    if (result) return NextResponse.json({ error: "Test already attempted" }, { status: 403 })

    // Hide correct answers from student response
    test.questions = test.questions.map(q => ({
      ...q,
      correctAnswer: ""
    }))
  }

  return NextResponse.json(test)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { answers, timeTaken } = data // answers: { questionId: answer }

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: { questions: true }
    })

    if (!test) throw new Error("Test not found")

    let score = 0
    let totalMarks = 0

    // Auto-grading logic
    test.questions.forEach(q => {
      const studentAnswer = answers[q.id]?.toString().trim() || ""
      const correctAnswer = q.correctAnswer.trim()
      
      let isCorrect = false
      
      if (q.questionType === "match") {
        // For Match the Following, order and internal whitespace around colons doesn't matter
        const studentPairs = studentAnswer.split("|")
          .map((p: string) => p.trim().toLowerCase())
          .filter(Boolean)
          .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
          .sort()
          
        const correctPairs = correctAnswer.split("|")
          .map((p: string) => p.trim().toLowerCase())
          .filter(Boolean)
          .map((p: string) => p.split(":").map(part => part.trim()).join(":"))
          .sort()

        isCorrect = studentPairs.length === correctPairs.length && 
                    studentPairs.every((p: string, i: number) => p === correctPairs[i])
      } else if (q.questionType === "jumbled") {
        // For jumbled questions, remove all whitespace to handle tokens joined by spaces
        isCorrect = studentAnswer.toLowerCase().replace(/\s+/g, "") === correctAnswer.toLowerCase().replace(/\s+/g, "")
      } else if (q.questionType === "fill" || q.questionType === "short") {
        // Allow multiple correct answers separated by commas
        const validAnswers = correctAnswer.split(",").map(a => a.trim().toLowerCase())
        isCorrect = validAnswers.includes(studentAnswer.toLowerCase())
      } else {
        // For other types like mcq and truefalse, case-insensitive comparison
        isCorrect = studentAnswer.toLowerCase() === correctAnswer.toLowerCase()
      }

      if (isCorrect) {
        score += q.marks
      }
      totalMarks += q.marks
    })

    const student = await prisma.student.findUnique({ where: { admno: session.user.email! } })
    const result = await prisma.result.create({
      data: {
        admno: student!.admno,
        testId: test.id,
        answers,
        score,
        totalMarks,
        timeTaken,
      }
    })

    return NextResponse.json(result)
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Test Submission Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
