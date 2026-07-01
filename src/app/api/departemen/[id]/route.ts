import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nama, deskripsi } = body

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama departemen harus diisi" }, { status: 400 })
    }

    // Check uniqueness (exclude current record)
    const existing = await prisma.departemen.findUnique({
      where: { nama: nama.trim() },
    })
    if (existing && existing.id !== Number(id)) {
      return NextResponse.json({ error: "Departemen dengan nama tersebut sudah ada" }, { status: 409 })
    }

    const departemen = await prisma.departemen.update({
      where: { id: Number(id) },
      data: {
        nama: nama.trim(),
        deskripsi: deskripsi?.trim() || null,
      },
      include: {
        _count: { select: { jabatan: true, karyawan: true } },
      },
    })

    return NextResponse.json(departemen)
  } catch (error) {
    console.error("Error updating departemen:", error)
    return NextResponse.json({ error: "Gagal memperbarui departemen" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if departemen has related jabatan or karyawan
    const dept = await prisma.departemen.findUnique({
      where: { id: Number(id) },
      include: {
        _count: { select: { jabatan: true, karyawan: true } },
      },
    })

    if (!dept) {
      return NextResponse.json({ error: "Departemen tidak ditemukan" }, { status: 404 })
    }

    if (dept._count.jabatan > 0 || dept._count.karyawan > 0) {
      const parts: string[] = []
      if (dept._count.jabatan > 0) parts.push(`${dept._count.jabatan} jabatan`)
      if (dept._count.karyawan > 0) parts.push(`${dept._count.karyawan} karyawan`)
      return NextResponse.json(
        { error: `Tidak dapat menghapus departemen. Masih ada ${parts.join(" dan ")} yang terkait.` },
        { status: 409 }
      )
    }

    await prisma.departemen.delete({
      where: { id: Number(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting departemen:", error)
    return NextResponse.json({ error: "Gagal menghapus departemen" }, { status: 500 })
  }
}
