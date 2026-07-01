import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tahun = searchParams.get("tahun") ?? String(new Date().getFullYear())

    const payrolls = await prisma.payroll.findMany({
      where: {
        periodeTahun: Number(tahun),
        status: { in: ["draft", "dikonfirmasi", "dibayar"] },
      },
      include: {
        karyawan: { select: { id: true, nik: true, nama: true } },
      },
      orderBy: { periodeBulan: "asc" },
    })

    // Aggregate per karyawan per tahun
    const map: Record<number, { karyawanId: number; nama: string; nik: string; totalGaji: number; totalTunjangan: number; totalPotongan: number; totalBersih: number; bulan: number; tahun: number }> = {}
    for (const p of payrolls) {
      if (!map[p.karyawanId]) {
        map[p.karyawanId] = { karyawanId: p.karyawanId, nama: p.karyawan.nama, nik: p.karyawan.nik, totalGaji: 0, totalTunjangan: 0, totalPotongan: 0, totalBersih: 0, bulan: p.periodeBulan, tahun: p.periodeTahun }
      }
      map[p.karyawanId].totalGaji      += p.gajiPokok
      map[p.karyawanId].totalTunjangan  += p.totalTunjangan
      map[p.karyawanId].totalPotongan   += p.totalPengurangan
      map[p.karyawanId].totalBersih     += p.gajiBersih
    }

    return NextResponse.json(Object.values(map).sort((a, b) => a.nama.localeCompare(b.nama)))
  } catch (error) {
    console.error("Error rekap payroll:", error)
    return NextResponse.json({ error: "Gagal membuat rekap" }, { status: 500 })
  }
}
