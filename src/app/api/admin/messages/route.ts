import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get("studentId")

  if (studentId) {
    const messages = await prisma.message.findMany({
      where: {
        teacherId: session.user.id,
        studentId: studentId
      },
      orderBy: { createdAt: 'asc' }
    })
    return NextResponse.json(messages)
  }

  // Get all students so the teacher can pick who to message
  const students = await prisma.student.findMany({
    select: { admno: true, name: true, class: true, section: true }
  })

  // Get latest message for each thread to show in list
  const allMessages = await prisma.message.findMany({
    where: { teacherId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { student: { select: { name: true, class: true, section: true } } }
  })

  return NextResponse.json({ students, messages: allMessages })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { studentId, content, type, class: className, sections } = body

    if (type === "broadcast") {
      if (!className || !sections || !Array.isArray(sections) || !content) {
        return NextResponse.json({ error: "Missing required fields for broadcast" }, { status: 400 })
      }

      const students = await prisma.student.findMany({
        where: {
          class: className,
          section: { in: sections }
        },
        select: { admno: true }
      })

      if (students.length === 0) {
        return NextResponse.json({ error: "No students found in selected sections" }, { status: 404 })
      }

      // Create messages for all students
      // Using a loop to handle creating many records while maintaining teacherId context
      // Prisma createMany is faster but individual creates ensure we follow the model relations perfectly
      const messages = await Promise.all(
        students.map(student => 
          prisma.message.create({
            data: {
              studentId: student.admno,
              teacherId: session.user.id as string,
              content,
              senderRole: "TEACHER"
            }
          })
        )
      )

      return NextResponse.json({ success: true, count: messages.length })
    }

    if (!studentId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const message = await prisma.message.create({
      data: {
        studentId,
        teacherId: session.user.id as string,
        content,
        senderRole: "TEACHER"
      }
    })

    return NextResponse.json(message)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
