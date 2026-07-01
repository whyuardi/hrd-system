import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const jabatan = await prisma.jabatan.findUnique({
      where: { id: Number(id) },
      include: {
        departemen: { select: { id: true, nama: true } },
      },
    })

    if (!jabatan) {
      return NextResponse.json({ error: "Jabatan tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(jabatan)
  } catch (error) {
    console.error("Error fetching jabatan:", error)
    return NextResponse.json({ error: "Gagal mengambil data jabatan" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nama, departemenId } = body

    if (!nama || !departemenId) {
      return NextResponse.json({ error: "Nama dan departemen harus diisi" }, { status: 400 })
    }

    // Check uniqueness (exclude current record)
    const existing = await prisma.jabatan.findUnique({
      where: { nama_departemenId: { nama, departemenId: Number(departemenId) } },
    })
    if (existing && existing.id !== Number(id)) {
      return NextResponse.json({ error: "Jabatan dengan nama tersebut sudah ada di departemen ini" }, { status: 409 })
    }

    const jabatan = await prisma.jabatan.update({
      where: { id: Number(id) },
      data: {
        nama,
        departemenId: Number(departemenId),
      },
      include: {
        departemen: { select: { id: true, nama: true } },
      },
    })

    return NextResponse.json(jabatan)
  } catch (error) {
    console.error("Error updating jabatan:", error)
    return NextResponse.json({ error: "Gagal memperbarui jabatan" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if jabatan has related karyawan
    const karyawanCount = await prisma.karyawan.count({
      where: { jabatanId: Number(id) },
    })

    if (karyawanCount > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus jabatan. Masih ada ${karyawanCount} karyawan yang menggunakan jabatan ini.` },
        { status: 409 }
      )
    }

    await prisma.jabatan.delete({
      where: { id: Number(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting jabatan:", error)
    return NextResponse.json({ error: "Gagal menghapus jabatan" }, { status: 500 })
  }
}
