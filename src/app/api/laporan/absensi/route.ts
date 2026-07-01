import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tahun = searchParams.get("tahun") ?? String(new Date().getFullYear())

    const startOfYear = new Date(Number(tahun), 0, 1)
    const endOfYear   = new Date(Number(tahun), 11, 31, 23, 59, 59)

    const absensi = await prisma.absensi.findMany({
      where: { tanggal: { gte: startOfYear, lte: endOfYear } },
      include: { karyawan: { select: { id: true, nik: true, nama: true } } },
      orderBy: { tanggal: "asc" },
    })

    // Group by karyawan
    const map: Record<number, { id: number; nik: string; nama: string; hadir: number; izin: number; sakit: number; cuti: number; alpha: number; total: number }> = {}
    for (const a of absensi) {
      if (!map[a.karyawanId]) {
        map[a.karyawanId] = { id: a.karyawanId, nik: a.karyawan.nik, nama: a.karyawan.nama, hadir: 0, izin: 0, sakit: 0, cuti: 0, alpha: 0, total: 0 }
      }
      const entry = map[a.karyawanId]
      switch (a.status) {
        case "hadir": entry.hadir++; break
        case "izin":  entry.izin++;  break
        case "sakit": entry.sakit++; break
        case "cuti":  entry.cuti++;  break
        case "alpha":  entry.alpha++; break
      }
      entry.total++
    }

    return NextResponse.json(Object.values(map).sort((a, b) => a.nama.localeCompare(b.nama)))
  } catch (error) {
    console.error("Error rekap absensi:", error)
    return NextResponse.json({ error: "Gagal membuat rekap" }, { status: 500 })
  }
}
