import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const test = await prisma.test.findUnique({
    where: { id: params.id, isActive: true },
    include: { questions: { orderBy: { order: "asc" } } }
  })

  if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 })

  // Check if already attempted
  const student = await prisma.student.findUnique({ where: { admno: session.user.email! } })
  const result = await prisma.result.findFirst({
    where: { testId: test.id, admno: student!.admno }
  })

  if (result) return NextResponse.json({ error: "Test already attempted" }, { status: 403 })

  return NextResponse.json(test)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "student") {
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
      const studentAnswer = answers[q.id]
      if (studentAnswer === q.correctAnswer) {
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
