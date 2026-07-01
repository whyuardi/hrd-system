import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const karyawanId = searchParams.get("karyawanId")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (karyawanId) where.karyawanId = Number(karyawanId)

    const cutiList = await prisma.cuti.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(cutiList)
  } catch (error) {
    console.error("Error fetching cuti:", error)
    return NextResponse.json({ error: "Gagal mengambil data cuti" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { karyawanId, jenis, tanggalMulai, tanggalSelesai, alasan } = body

    // Validation
    if (!karyawanId || !jenis || !tanggalMulai || !tanggalSelesai || !alasan) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      )
    }

    const validJenis = ["tahunan", "sakit", "melahirkan", "pernikahan"]
    if (!validJenis.includes(jenis)) {
      return NextResponse.json(
        { error: "Jenis cuti tidak valid" },
        { status: 400 }
      )
    }

    const mulai = new Date(tanggalMulai)
    const selesai = new Date(tanggalSelesai)
    if (selesai < mulai) {
      return NextResponse.json(
        { error: "Tanggal selesai tidak boleh sebelum tanggal mulai" },
        { status: 400 }
      )
    }

    // Check employee exists
    const karyawan = await prisma.karyawan.findUnique({
      where: { id: Number(karyawanId) },
    })
    if (!karyawan) {
      return NextResponse.json({ error: "Karyawan tidak ditemukan" }, { status: 404 })
    }

    const cuti = await prisma.cuti.create({
      data: {
        karyawanId: Number(karyawanId),
        jenis,
        tanggalMulai: mulai,
        tanggalSelesai: selesai,
        alasan: alasan.trim(),
        status: "menunggu",
      },
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

    return NextResponse.json(cuti, { status: 201 })
  } catch (error) {
    console.error("Error creating cuti:", error)
    return NextResponse.json({ error: "Gagal membuat pengajuan cuti" }, { status: 500 })
  }
}