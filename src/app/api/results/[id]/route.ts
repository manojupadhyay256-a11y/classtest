import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results = await prisma.result.findMany({
    where: { testId: params.id },
    include: { 
      student: { select: { name: true, admno: true, class: true, section: true } }
    },
    orderBy: { score: "desc" }
  })

  const test = await prisma.test.findUnique({
    where: { id: params.id },
    select: { title: true, subject: true }
  })

  return NextResponse.json({ results, test })
}
