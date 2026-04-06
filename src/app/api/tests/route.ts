import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    const { title, subject, class: className, section, duration, startTime, endTime } = data

    const test = await prisma.test.create({
      data: {
        title,
        subject,
        class: className,
        section,
        duration: parseInt(duration),
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        createdBy: session.user.id!,
      }
    })
    
    revalidatePath("/admin/tests")
    revalidatePath("/admin/dashboard")

    return NextResponse.json(test)
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Test Creation Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tests = await prisma.test.findMany({
    where: { createdBy: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true } } }
  })
  return NextResponse.json(tests)
}
