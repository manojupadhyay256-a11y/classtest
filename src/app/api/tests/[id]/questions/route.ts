import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { questionText, questionType, marks, order, correctAnswer, options } = data

    const question = await prisma.question.create({
      data: {
        testId: params.id,
        questionText,
        questionType,
        marks: parseInt(marks),
        order: parseInt(order),
        correctAnswer,
        options: options || undefined,
      }
    })

    return NextResponse.json(question)
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Question Creation Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const questions = await prisma.question.findMany({
    where: { testId: params.id },
    orderBy: { order: "asc" }
  })

  return NextResponse.json(questions)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await prisma.question.deleteMany({
      where: { testId: params.id }
    })
    return NextResponse.json({ message: "All questions cleared successfully" })
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Clear All Questions Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
