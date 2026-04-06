import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isAdmin = session.user.role === "ADMIN"

  try {
    // Check ownership if not admin
    if (!isAdmin) {
      const questionData = await prisma.question.findUnique({
        where: { id: params.id },
        select: { test: { select: { createdBy: true } } }
      })
      if (!questionData || questionData.test.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized: You can only delete your own questions" }, { status: 403 })
      }
    }

    const question = await prisma.question.delete({
      where: { id: params.id }
    })
    return NextResponse.json({ message: "Question deleted successfully", question })
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Delete Question Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isAdmin = session.user.role === "ADMIN"

  try {
    // Check ownership if not admin
    if (!isAdmin) {
      const questionData = await prisma.question.findUnique({
        where: { id: params.id },
        select: { test: { select: { createdBy: true } } }
      })
      if (!questionData || questionData.test.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized: You can only modify your own questions" }, { status: 403 })
      }
    }

    const data = await req.json()
    const question = await prisma.question.update({
      where: { id: params.id },
      data
    })
    return NextResponse.json(question)
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Update Question Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
