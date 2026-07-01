import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate   = searchParams.get("startDate")
    const endDate     = searchParams.get("endDate")
    const karyawanId  = searchParams.get("karyawanId")
    const status      = searchParams.get("status")
    const page        = Number(searchParams.get("page") ?? 1)
    const limit       = Number(searchParams.get("limit") ?? 20)

    const where: Record<string, unknown> = {}

    if (startDate || endDate) {
      where.tanggal = {}
      if (startDate) (where.tanggal as Record<string, unknown>).gte = new Date(startDate)
      if (endDate)   (where.tanggal as Record<string, unknown>).lte = new Date(endDate + "T23:59:59")
    }
    if (karyawanId) where.karyawanId = Number(karyawanId)
    if (status)     where.status     = status

    const [absensi, total] = await Promise.all([
      prisma.absensi.findMany({
        where,
        include: {
          karyawan: {
            select: {
              id: true, nik: true, nama: true,
              departemen: { select: { nama: true } },
              jabatan:   { select: { nama: true } },
            },
          },
        },
        orderBy: [{ tanggal: "desc" }, { checkIn: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.absensi.count({ where }),
    ])

    return NextResponse.json({ data: absensi, total, page, limit })
  } catch (error) {
    console.error("Error fetching absensi:", error)
    return NextResponse.json({ error: "Gagal mengambil data absensi" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, karyawanId } = body

    if (!action || !["checkin", "checkout"].includes(action)) {
      return NextResponse.json({ error: "Aksi tidak valid. Gunakan checkin atau checkout." }, { status: 400 })
    }
    if (!karyawanId) {
      return NextResponse.json({ error: "ID karyawan harus diisi" }, { status: 400 })
    }

    const now    = new Date()
    const tanggal = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const existing = await prisma.absensi.findUnique({
      where: {
        karyawanId_tanggal: { karyawanId: Number(karyawanId), tanggal },
      },
    })

    if (action === "checkin") {
      if (existing) {
        return NextResponse.json({ error: "Karyawan sudah check-in hari ini." }, { status: 409 })
      }
      const absensi = await prisma.absensi.create({
        data: { karyawanId: Number(karyawanId), tanggal, checkIn: now, status: "hadir" },
        include: {
          karyawan: {
            select: { id: true, nik: true, nama: true, departemen: { select: { nama: true } }, jabatan: { select: { nama: true } } },
          },
        },
      })
      return NextResponse.json(absensi, { status: 201 })
    }

    if (action === "checkout") {
      if (!existing) {
        return NextResponse.json({ error: "Belum ada record absensi untuk check-out. Lakukan check-in terlebih dahulu." }, { status: 404 })
      }
      if (existing.checkOut) {
        return NextResponse.json({ error: "Sudah check-out hari ini." }, { status: 409 })
      }
      const absensi = await prisma.absensi.update({
        where: { id: existing.id },
        data: { checkOut: now },
        include: {
          karyawan: {
            select: { id: true, nik: true, nama: true, departemen: { select: { nama: true } }, jabatan: { select: { nama: true } } },
          },
        },
      })
      return NextResponse.json(absensi)
    }

    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 })
  } catch (error) {
    console.error("Error in absensi POST:", error)
    return NextResponse.json({ error: "Gagal menyimpan absensi" }, { status: 500 })
  }
}