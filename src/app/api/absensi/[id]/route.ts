import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const VALID_STATUSES = ["hadir", "izin", "sakit", "cuti", "alpha"]

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, keterangan } = body

    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Status tidak valid. Pilihan: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (keterangan !== undefined) updateData.keterangan = keterangan

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Tidak ada data yang diperbarui" }, { status: 400 })
    }

    const absensi = await prisma.absensi.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        karyawan: {
          select: {
            id: true,
            nik: true,
            nama: true,
            departemen: { select: { nama: true } },
            jabatan: { select: { nama: true } },
          },
        },
      },
    })

    return NextResponse.json(absensi)
  } catch (error) {
    console.error("Error updating absensi:", error)
    return NextResponse.json({ error: "Gagal memperbarui absensi" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const absensi = await prisma.absensi.findUnique({
      where: { id: Number(id) },
      include: {
        karyawan: {
          select: {
            id: true,
            nik: true,
            nama: true,
            departemen: { select: { nama: true } },
            jabatan: { select: { nama: true } },
          },
        },
      },
    })

    if (!absensi) {
      return NextResponse.json({ error: "Data absensi tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(absensi)
  } catch (error) {
    console.error("Error fetching absensi by id:", error)
    return NextResponse.json({ error: "Gagal mengambil data absensi" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.absensi.delete({
      where: { id: Number(id) },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting absensi:", error)
    return NextResponse.json({ error: "Gagal menghapus absensi" }, { status: 500 })
  }
}