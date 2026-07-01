import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const departemen = await prisma.departemen.findMany({
      orderBy: { nama: "asc" },
      include: {
        _count: { select: { jabatan: true, karyawan: true } },
      },
    })
    return NextResponse.json(departemen)
  } catch (error) {
    console.error("Error fetching departemen:", error)
    return NextResponse.json({ error: "Gagal mengambil data departemen" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nama, deskripsi } = body

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama departemen harus diisi" }, { status: 400 })
    }

    // Check uniqueness
    const existing = await prisma.departemen.findUnique({
      where: { nama: nama.trim() },
    })
    if (existing) {
      return NextResponse.json({ error: "Departemen dengan nama tersebut sudah ada" }, { status: 409 })
    }

    const departemen = await prisma.departemen.create({
      data: {
        nama: nama.trim(),
        deskripsi: deskripsi?.trim() || null,
      },
      include: {
        _count: { select: { jabatan: true, karyawan: true } },
      },
    })

    return NextResponse.json(departemen, { status: 201 })
  } catch (error) {
    console.error("Error creating departemen:", error)
    return NextResponse.json({ error: "Gagal membuat departemen" }, { status: 500 })
  }
}
