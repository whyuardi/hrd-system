import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ─── GET: List payroll ───
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bulan    = searchParams.get("bulan")
    const tahun    = searchParams.get("tahun")
    const status   = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (bulan)  where.periodeBulan  = Number(bulan)
    if (tahun)  where.periodeTahun  = Number(tahun)
    if (status) where.status         = status

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        karyawan: {
          select: {
            id: true, nik: true, nama: true, departemen: { select: { nama: true } }, jabatan: { select: { nama: true } },
          },
        },
      },
      orderBy: [{ periodeTahun: "desc" }, { periodeBulan: "desc" }, { createdAt: "desc" }],
      take: 500,
    })

    return NextResponse.json(payrolls)
  } catch (error) {
    console.error("Error fetching payroll:", error)
    return NextResponse.json({ error: "Gagal mengambil data payroll" }, { status: 500 })
  }
}

// ─── POST: Create payroll ───
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items } = body  // Array of payroll items

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Data payroll harus diisi" }, { status: 400 })
    }

    const results = []
    for (const item of items) {
      const { karyawanId, periodeBulan, periodeTahun, bpjsKesehatan, bpjsKetenagakerjaan, pph21, totalTunjangan, totalLembur, totalPotongan } = item

      if (!karyawanId || !periodeBulan || !periodeTahun) continue

      // Get karyawan for gajiPokok
      const karyawan = await prisma.karyawan.findUnique({ where: { id: Number(karyawanId) } })
      if (!karyawan) continue

      const gajiPokok = karyawan.gajiPokok || 0
      const bpjsKs    = bpjsKesehatan ?? Math.min(gajiPokok * 0.01, 120000)
      const bpjsTk    = bpjsKetenagakerjaan ?? (gajiPokok * 0.02)
      const pajak     = pph21 ?? 0
      const tunjangan = totalTunjangan ?? 0
      const lembur    = totalLembur ?? 0
      const potongan  = totalPotongan ?? 0

      const totalPenerimaan = gajiPokok + tunjangan + lembur
      const totalPengurangan = bpjsKs + bpjsTk + pajak + potongan
      const gajiBersih = totalPenerimaan - totalPengurangan

      const payroll = await prisma.payroll.upsert({
        where: {
          karyawanId_periodeBulan_periodeTahun: {
            karyawanId: Number(karyawanId),
            periodeBulan: Number(periodeBulan),
            periodeTahun: Number(periodeTahun),
          },
        },
        update: {
          gajiPokok, totalTunjangan: tunjangan, totalLembur: lembur,
          totalPotongan: potongan, bpjsKesehatan: bpjsKs, bpjsKetenagakerjaan: bpjsTk,
          pph21: pajak, totalPenerimaan, totalPengurangan, gajiBersih, status: "draft",
        },
        create: {
          karyawanId: Number(karyawanId),
          periodeBulan: Number(periodeBulan),
          periodeTahun: Number(periodeTahun),
          gajiPokok, totalTunjangan: tunjangan, totalLembur: lembur,
          totalPotongan: potongan, bpjsKesehatan: bpjsKs, bpjsKetenagakerjaan: bpjsTk,
          pph21: pajak, totalPenerimaan, totalPengurangan, gajiBersih, status: "draft",
        },
      })
      results.push(payroll)
    }

    return NextResponse.json({ message: `Berhasil menyimpan ${results.length} payroll`, data: results }, { status: 201 })
  } catch (error) {
    console.error("Error creating payroll:", error)
    return NextResponse.json({ error: "Gagal menyimpan payroll" }, { status: 500 })
  }
}
