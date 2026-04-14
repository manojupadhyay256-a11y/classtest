import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    let unreadCount = 0;

    if (session.user.role === "STUDENT") {
      // Unread messages sent by teachers to this student
      unreadCount = await prisma.message.count({
        where: {
          studentId: session.user.email!,
          senderRole: "TEACHER",
          isRead: false
        }
      })
    } else {
      // Unread messages sent by students to this teacher
      unreadCount = await prisma.message.count({
        where: {
          teacherId: session.user.id,
          senderRole: "STUDENT",
          isRead: false
        }
      })
    }

    return NextResponse.json({ unreadCount })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
