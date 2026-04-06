import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import bcrypt from "bcryptjs"

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const teachers = await prisma.teacher.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      _count: { select: { tests: true } }
    } as any // eslint-disable-line @typescript-eslint/no-explicit-any
  })

  return NextResponse.json(teachers)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { name, email, password, role } = await req.json()
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const teacher = await prisma.teacher.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || "TEACHER"
      } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    })

    const result = { ...teacher } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    delete result.password
    return NextResponse.json(result)
  } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.error("Teacher Creation Error:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
