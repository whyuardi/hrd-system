import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const cuti = await prisma.cuti.findUnique({
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
        approvals: {
          include: {
            user: { select: { id: true, nama: true, role: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!cuti) {
      return NextResponse.json({ error: "Data cuti tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(cuti)
  } catch (error) {
    console.error("Error fetching cuti:", error)
    return NextResponse.json({ error: "Gagal mengambil data cuti" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { jenis, tanggalMulai, tanggalSelesai, alasan, status } = body

    const existing = await prisma.cuti.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return NextResponse.json({ error: "Data cuti tidak ditemukan" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (jenis !== undefined) {
      const validJenis = ["tahunan", "sakit", "melahirkan", "pernikahan"]
      if (!validJenis.includes(jenis)) {
        return NextResponse.json({ error: "Jenis cuti tidak valid" }, { status: 400 })
      }
      updateData.jenis = jenis
    }

    if (tanggalMulai !== undefined) updateData.tanggalMulai = new Date(tanggalMulai)
    if (tanggalSelesai !== undefined) updateData.tanggalSelesai = new Date(tanggalSelesai)
    if (alasan !== undefined) updateData.alasan = alasan.trim()

    if (status !== undefined) {
      const validStatus = ["menunggu", "disetujui", "ditolak"]
      if (!validStatus.includes(status)) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 })
      }
      updateData.status = status
    }

    const cuti = await prisma.cuti.update({
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
        approvals: {
          include: {
            user: { select: { id: true, nama: true, role: true } },
          },
        },
      },
    })

    return NextResponse.json(cuti)
  } catch (error) {
    console.error("Error updating cuti:", error)
    return NextResponse.json({ error: "Gagal memperbarui data cuti" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await prisma.cuti.findUnique({ where: { id: Number(id) } })
    if (!existing) {
      return NextResponse.json({ error: "Data cuti tidak ditemukan" }, { status: 404 })
    }

    await prisma.cuti.delete({ where: { id: Number(id) } })

    return NextResponse.json({ message: "Data cuti berhasil dihapus" })
  } catch (error) {
    console.error("Error deleting cuti:", error)
    return NextResponse.json({ error: "Gagal menghapus data cuti" }, { status: 500 })
  }
}