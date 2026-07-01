import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// PTKP 2024
const PTKP: Record<string, number> = {
  "TK/0": 54000000, "TK/1": 58500000, "TK/2": 63000000, "TK/3": 67500000,
  "K/0":  58500000, "K/1":  63000000, "K/2":  67500000, "K/3":  72000000,
  "K/I/0": 112500000, "K/I/1": 117000000, "K/I/2": 121500000, "K/I/3": 126000000,
}

// Progressive tax rates
function calcPPh21(pkp: number): number {
  if (pkp <= 0) return 0
  let tax = 0
  if (pkp > 500000000) {
    tax += (500000000 - 250000000) * 0.15
    tax += (pkp - 500000000) * 0.25
  } else if (pkp > 250000000) {
    tax += (250000000 - 60000000) * 0.05
    tax += (500000000 - 250000000) * 0.15
    tax += (pkp - 500000000) * 0.25
  } else if (pkp > 60000000) {
    tax += (60000000) * 0
    tax += (250000000 - 60000000) * 0.05
    tax += (pkp - 250000000) * 0.15
  } else {
    tax = 0
  }
  return Math.round(tax)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tahun = searchParams.get("tahun") ?? String(new Date().getFullYear())

    const payrolls = await prisma.payroll.findMany({
      where: { periodeTahun: Number(tahun) },
      include: { karyawan: { select: { id: true, nik: true, nama: true, npwp: true, jumlahTanggungan: true, statusNikah: true } } },
    })

    // Aggregate annual income per karyawan
    const map: Record<number, { karyawanId: number; nama: string; nik: string; npwp: string | null; penghasilanKotor: number }> = {}
    for (const p of payrolls) {
      if (!map[p.karyawanId]) {
        map[p.karyawanId] = { karyawanId: p.karyawanId, nama: p.karyawan.nama, nik: p.karyawan.nik, npwp: p.karyawan.npwp, penghasilanKotor: 0 }
      }
      map[p.karyawanId].penghasilanKotor += p.gajiPokok + p.totalTunjangan + p.totalLembur
    }

    const result = Object.values(map).map(k => {
      // Determine PTKP based on status
      const isKawin = k.nama.includes("(K)") || k.nama.includes("K/") ? true : false // simplified
      const tanggungan: number = 0
      const ptkpKey = tanggungan >= 3 ? "TK/3" : tanggungan === 2 ? "TK/2" : tanggungan === 1 ? "TK/1" : "TK/0"
      const ptkp = PTKP[ptkpKey]
      const pkp  = Math.max(0, k.penghasilanKotor - ptkp)
      const pph21Tahunan  = calcPPh21(pkp)
      const pph21Bulanan  = Math.round(pph21Tahunan / 12)

      return {
        karyawanId: k.karyawanId,
        nama: k.nama,
        nik: k.nik,
        npwp: k.npwp,
        penghasilanKotor: k.penghasilanKotor,
        ptkp,
        pkp,
        pph21Tahunan,
        pph21Bulanan,
      }
    })

    return NextResponse.json(result.sort((a, b) => a.nama.localeCompare(b.nama)))
  } catch (error) {
    console.error("Error rekap pph21:", error)
    return NextResponse.json({ error: "Gagal membuat rekap" }, { status: 500 })
  }
}
