import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isAdmin = session.user.role === "ADMIN"

  try {
    // Check ownership if not admin
    if (!isAdmin) {
      const test = await prisma.test.findUnique({
        where: { id: params.id },
        select: { createdBy: true }
      })
      if (!test || test.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized: You can only modify your own tests" }, { status: 403 })
      }
    }

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
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isAdmin = session.user.role === "ADMIN"

  try {
    // Check ownership if not admin
    if (!isAdmin) {
      const test = await prisma.test.findUnique({
        where: { id: params.id },
        select: { createdBy: true }
      })
      if (!test || test.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized: You can only view questions for your own tests" }, { status: 403 })
      }
    }

    const questions = await prisma.question.findMany({
      where: { testId: params.id },
      orderBy: { order: "asc" }
    })

    return NextResponse.json(questions)
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Fetch Questions Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isAdmin = session.user.role === "ADMIN"

  try {
    // Check ownership if not admin
    if (!isAdmin) {
      const test = await prisma.test.findUnique({
        where: { id: params.id },
        select: { createdBy: true }
      })
      if (!test || test.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized: You can only clear questions for your own tests" }, { status: 403 })
      }
    }

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
