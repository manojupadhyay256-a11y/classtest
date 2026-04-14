import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { studentId, teacherId } = body

    if (!studentId || !teacherId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    if (session.user.role === "STUDENT") {
      // Mark messages from this teacher to this student as read
      await prisma.message.updateMany({
        where: {
          studentId: session.user.email!,
          teacherId: teacherId,
          senderRole: "TEACHER",
          isRead: false
        },
        data: { isRead: true }
      })
    } else {
      // Mark messages from this student to this teacher as read
      await prisma.message.updateMany({
        where: {
          studentId: studentId,
          teacherId: session.user.id,
          senderRole: "STUDENT",
          isRead: false
        },
        data: { isRead: true }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
