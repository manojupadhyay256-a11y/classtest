import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isAdmin = session.user.role === "ADMIN"

  try {
    // Check ownership if not admin
    if (!isAdmin) {
      const existingTest = await prisma.test.findUnique({
        where: { id: params.id },
        select: { createdBy: true }
      })
      if (!existingTest || existingTest.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized: You can only modify your own tests" }, { status: 403 })
      }
    }

    const data = await req.json()
    const { isActive, title, subject, class: className, sections: sectionsInput, duration, startTime, endTime } = data

    const updateData: Record<string, unknown> = {}
    if (isActive !== undefined) {
      if (isActive) {
        const qCount = await prisma.question.count({ where: { testId: params.id } })
        if (qCount === 0) {
          return NextResponse.json({ error: "Cannot activate a test with no questions" }, { status: 400 })
        }
      }
      updateData.isActive = !!isActive
    }

    if (title) updateData.title = title
    if (subject) updateData.subject = subject
    if (className) updateData.class = className
    if (sectionsInput !== undefined) {
      updateData.sections = Array.isArray(sectionsInput) 
        ? sectionsInput 
        : (sectionsInput?.split(",").map((s: string) => s.trim()) || [])
    }
    if (duration !== undefined) updateData.duration = parseInt(duration)
    if (startTime !== undefined) updateData.startTime = startTime ? new Date(startTime) : null
    if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null

    const test = await prisma.test.update({
      where: { id: params.id },
      data: updateData
    })
    
    revalidatePath("/admin/tests")
    revalidatePath("/admin/dashboard")

    return NextResponse.json(test)
  } catch (error: unknown) {
    const err = error as Error;
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
      const existingTest = await prisma.test.findUnique({
        where: { id: params.id },
        select: { createdBy: true }
      })
      if (!existingTest || existingTest.createdBy !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized: You can only delete your own tests" }, { status: 403 })
      }
    }

    await prisma.test.delete({ where: { id: params.id } })
    
    revalidatePath("/admin/tests")
    revalidatePath("/admin/dashboard")

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
