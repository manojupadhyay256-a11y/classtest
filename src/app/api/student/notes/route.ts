import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/student/notes — returns notes matching the student's class and section
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const student = await prisma.student.findUnique({
    where: { admno: session.user.id }
  })

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 })
  }

  console.log("[Student Notes] Student class:", JSON.stringify(student.class), "section:", JSON.stringify(student.section))

  const notes = await prisma.note.findMany({
    where: {
      class: student.class,
      sections: { has: student.section }
    },
    include: {
      teacher: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  })

  console.log("[Student Notes] Found", notes.length, "notes. All notes classes:", 
    (await prisma.note.findMany({ select: { class: true, sections: true } }))
  )

  return NextResponse.json(notes)
}
