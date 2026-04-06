import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const userId = session.user.id
    const role = session.user.role

    if (role === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { admno: userId }
      })

      if (!student || !bcrypt.compareSync(currentPassword, student.password)) {
        return NextResponse.json({ error: "Invalid current password" }, { status: 400 })
      }

      await prisma.student.update({
        where: { admno: userId },
        data: { password: bcrypt.hashSync(newPassword, 10) }
      })
    } else if (role === "TEACHER" || role === "ADMIN") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: userId }
      })

      if (!teacher || !bcrypt.compareSync(currentPassword, teacher.password)) {
        return NextResponse.json({ error: "Invalid current password" }, { status: 400 })
      }

      await prisma.teacher.update({
        where: { id: userId },
        data: { password: bcrypt.hashSync(newPassword, 10) }
      })
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    return NextResponse.json({ message: "Password updated successfully" })
  } catch (error) {
    console.error("Password update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
