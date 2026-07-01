import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = session.user.role?.toLowerCase()
    const approvableRoles = ["admin", "hrd"]

    if (!approvableRoles.includes(userRole ?? "")) {
      return NextResponse.json(
        { error: "Hanya admin/HRD yang dapat menyetujui cuti" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status, catatan } = body

    const validStatuses = ["disetujui", "ditolak", "menunggu"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status harus 'disetujui' atau 'ditolak'" },
        { status: 400 }
      )
    }

    const existing = await prisma.cuti.findUnique({
      where: { id: Number(id) },
      include: { approvals: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Data cuti tidak ditemukan" }, { status: 404 })
    }

    if (existing.status !== "menunggu" && status !== "menunggu") {
      return NextResponse.json(
        { error: "Pengajuan cuti sudah diproses sebelumnya" },
        { status: 400 }
      )
    }

    // Determine approval level based on role
    const tingkat = userRole === "admin" ? 2 : 1

    // Upsert the approval record
    const approval = await prisma.cutiApproval.upsert({
      where: {
        cutiId_tingkat: {
          cutiId: Number(id),
          tingkat,
        },
      },
      create: {
        cutiId: Number(id),
        userId: Number(session.user.id),
        tingkat,
        status,
        catatan: catatan?.trim() || null,
      },
      update: {
        status,
        catatan: catatan?.trim() || null,
      },
      include: {
        user: { select: { id: true, nama: true, role: true } },
      },
    })

    // Update the cuti status
    const updatedCuti = await prisma.cuti.update({
      where: { id: Number(id) },
      data: { status },
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

    return NextResponse.json(updatedCuti)
  } catch (error) {
    console.error("Error approving cuti:", error)
    return NextResponse.json({ error: "Gagal memproses persetujuan cuti" }, { status: 500 })
  }
}