import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const departemenId = searchParams.get("departemenId")

    const where = departemenId ? { departemenId: Number(departemenId) } : {}

    const jabatan = await prisma.jabatan.findMany({
      where,
      include: {
        departemen: { select: { id: true, nama: true } },
        _count: { select: { karyawan: true } },
      },
      orderBy: { nama: "asc" },
    })

    return NextResponse.json(jabatan)
  } catch (error) {
    console.error("Error fetching jabatan:", error)
    return NextResponse.json({ error: "Gagal mengambil data jabatan" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nama, departemenId } = body

    if (!nama || !departemenId) {
      return NextResponse.json({ error: "Nama dan departemen harus diisi" }, { status: 400 })
    }

    // Check uniqueness
    const existing = await prisma.jabatan.findUnique({
      where: { nama_departemenId: { nama, departemenId: Number(departemenId) } },
    })
    if (existing) {
      return NextResponse.json({ error: "Jabatan dengan nama tersebut sudah ada di departemen ini" }, { status: 409 })
    }

    const jabatan = await prisma.jabatan.create({
      data: {
        nama,
        departemenId: Number(departemenId),
      },
      include: {
        departemen: { select: { id: true, nama: true } },
      },
    })

    return NextResponse.json(jabatan, { status: 201 })
  } catch (error) {
    console.error("Error creating jabatan:", error)
    return NextResponse.json({ error: "Gagal membuat jabatan" }, { status: 500 })
  }
}
