import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    // Only Admin can view login history
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const logs = await prisma.loginLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 50 // Get last 50 logins
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("GET Login History Error:", error)
    return NextResponse.json({ error: "Failed to fetch login history" }, { status: 500 })
  }
}
