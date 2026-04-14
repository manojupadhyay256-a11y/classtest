import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const teacherId = searchParams.get("teacherId")

  if (teacherId) {
    const messages = await prisma.message.findMany({
      where: {
        studentId: session.user.email!,
        teacherId: teacherId
      },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(messages)
  }

  // Get all teachers so the student can pick who to message
  const teachers = await prisma.teacher.findMany({
    select: { id: true, name: true, email: true }
  })

  // Get latest message for each thread to show in list
  const allMessages = await prisma.message.findMany({
    where: { studentId: session.user.email! },
    orderBy: { createdAt: 'desc' },
    include: { teacher: { select: { name: true } } }
  })

  return NextResponse.json({ teachers, messages: allMessages })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { teacherId, content } = body

    if (!teacherId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        studentId: session.user.email!,
        teacherId,
        content,
        senderRole: "STUDENT"
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
