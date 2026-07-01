import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tahun = searchParams.get("tahun") ?? String(new Date().getFullYear())

    const payrolls = await prisma.payroll.findMany({
      where: { periodeTahun: Number(tahun) },
      include: { karyawan: { select: { id: true, nik: true, nama: true } } },
    })

    const map: Record<number, { karyawanId: number; nama: string; nik: string; bpjsKsEmployee: number; bpjsKsEmployer: number; bpjsTkEmployee: number; bpjsTkEmployer: number; total: number }> = {}
    for (const p of payrolls) {
      if (!map[p.karyawanId]) {
        map[p.karyawanId] = { karyawanId: p.karyawanId, nama: p.karyawan.nama, nik: p.karyawan.nik, bpjsKsEmployee: 0, bpjsKsEmployer: 0, bpjsTkEmployee: 0, bpjsTkEmployer: 0, total: 0 }
      }
      const ks = p.bpjsKesehatan; // employee 1%
      const tk = p.bpjsKetenagakerjaan // employee 2%
      map[p.karyawanId].bpjsKsEmployee += ks
      map[p.karyawanId].bpjsKsEmployer += ks * 4 // employer 4%
      map[p.karyawanId].bpjsTkEmployee += tk
      map[p.karyawanId].bpjsTkEmployer += tk * 2.27 // employer ~5.74% total
      map[p.karyawanId].total += ks + (ks * 4) + tk + (tk * 2.27)
    }

    return NextResponse.json(Object.values(map).sort((a, b) => a.nama.localeCompare(b.nama)))
  } catch (error) {
    console.error("Error rekap bpjs:", error)
    return NextResponse.json({ error: "Gagal membuat rekap" }, { status: 500 })
  }
}
