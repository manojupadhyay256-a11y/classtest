import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user).role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const students = await prisma.student.findMany({
      orderBy: { name: "asc" },
    })
    return NextResponse.json(students)
  } catch (error) {
    console.error("GET Students Error:", error)
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
  }
}

interface StudentData {
  admno: string | number;
  name: string | number;
  class: string | number;
  section: string | number;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const data = await req.json()
    
    if (Array.isArray(data)) {
      // Filter out rows that are missing required fields (admno, name, class, section)
      const validData = data.filter((s: Partial<StudentData>) => 
        s && 
        (s.admno !== undefined && s.admno !== null && s.admno.toString().trim() !== "") && 
        (s.name !== undefined && s.name !== null && s.name.toString().trim() !== "") && 
        (s.class !== undefined && s.class !== null && s.class.toString().trim() !== "") && 
        (s.section !== undefined && s.section !== null && s.section.toString().trim() !== "")
      )

      if (validData.length === 0) {
        return NextResponse.json({ count: 0, message: "No valid student records found in the upload." })
      }

      const studentsToCreate = await Promise.all(validData.map(async (s: Partial<StudentData>) => {
        const admnoStr = (s.admno as string | number).toString().trim()
        const hashedPassword = await bcrypt.hash(admnoStr, 10)
        return {
          admno: admnoStr,
          name: (s.name as string | number).toString().trim(),
          class: (s.class as string | number).toString().trim(),
          section: (s.section as string | number).toString().trim(),
          password: hashedPassword,
        }
      }))

      // Use an interactive transaction to ensure all-or-nothing for the batch
      // Increased timeout to 30s to handle hashing and multiple upserts
      const result = await prisma.$transaction(async (tx) => {
        return Promise.all(
          studentsToCreate.map(s => tx.student.upsert({
            where: { admno: s.admno },
            update: { name: s.name, class: s.class, section: s.section },
            create: s
          }))
        )
      }, { timeout: 30000 })
      return NextResponse.json({ count: result.length })
    } 
    
    // Individual creation
    const { admno, name, class: className, section } = data
    
    if (!admno || !name || !className || !section) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(admno.toString(), 10)
    const student = await prisma.student.upsert({
      where: { admno: admno.toString() },
      update: { name, class: className, section },
      create: {
        admno: admno.toString(),
        name,
        class: className,
        section,
        password: hashedPassword,
      }
    })
    
    return NextResponse.json(student)
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Student API Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const admno = searchParams.get("admno")

  if (!admno) return NextResponse.json({ error: "Missing admno" }, { status: 400 })

  await prisma.student.delete({ where: { admno } })
  return NextResponse.json({ success: true })
}
