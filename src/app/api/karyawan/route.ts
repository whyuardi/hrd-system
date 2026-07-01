import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "aktif"
    const q = searchParams.get("q")

    const where: Record<string, unknown> = {}
    if (status === "all") {
      // no status filter
    } else if (status) {
      where.status = status
    } else {
      where.status = "aktif"
    }

    if (q) {
      where.OR = [
        { nama: { contains: q } },
        { nik: { contains: q } },
      ]
    }

    const karyawan = await prisma.karyawan.findMany({
      where,
      select: {
        id: true,
        nik: true,
        nama: true,
        departemen: { select: { nama: true } },
        jabatan: { select: { nama: true } },
      },
      orderBy: { nama: "asc" },
    })

    return NextResponse.json(karyawan)
  } catch (error) {
    console.error("Error fetching karyawan:", error)
    return NextResponse.json({ error: "Gagal mengambil data karyawan" }, { status: 500 })
  }
}