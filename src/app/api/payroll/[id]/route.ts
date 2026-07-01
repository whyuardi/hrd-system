import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ─── GET: Single payroll ───
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payroll = await prisma.payroll.findUnique({
      where: { id: Number(id) },
      include: {
        karyawan: {
          select: {
            id: true, nik: true, nama: true, email: true, telepon: true,
            departemen: { select: { nama: true } },
            jabatan: { select: { nama: true } },
            npwp: true, noRekening: true, bank: true,
          },
        },
      },
    })
    if (!payroll) return NextResponse.json({ error: "Payroll tidak ditemukan" }, { status: 404 })
    return NextResponse.json(payroll)
  } catch (error) {
    console.error("Error fetching payroll:", error)
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 })
  }
}

// ─── PATCH: Update status ───
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    const valid = ["draft", "dikonfirmasi", "dibayar"]
    if (status && !valid.includes(status)) {
      return NextResponse.json({ error: `Status harus salah satu: ${valid.join(", ")}` }, { status: 400 })
    }

    const updated = await prisma.payroll.update({
      where: { id: Number(id) },
      data: { status },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating payroll:", error)
    return NextResponse.json({ error: "Gagal mengupdate payroll" }, { status: 500 })
  }
}
