import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
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
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
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
