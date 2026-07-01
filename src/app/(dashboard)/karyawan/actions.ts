"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

function buildUpdateData(raw: Record<string, unknown>) {
  return {
    nik: raw.nik as string,
    nama: raw.nama as string,
    email: (raw.email as string) || null,
    telepon: (raw.telepon as string) || null,
    alamat: (raw.alamat as string) || null,
    tempatLahir: (raw.tempatLahir as string) || null,
    tanggalLahir: raw.tanggalLahir ? new Date(raw.tanggalLahir as string) : null,
    jenisKelamin: (raw.jenisKelamin as string) || null,
    agama: (raw.agama as string) || null,
    statusNikah: (raw.statusNikah as string) || null,
    jumlahTanggungan: parseInt(raw.jumlahTanggungan as string) || 0,
    departemenId: parseInt(raw.departemenId as string),
    jabatanId: parseInt(raw.jabatanId as string),
    tanggalMasuk: raw.tanggalMasuk ? new Date(raw.tanggalMasuk as string) : new Date(),
    tanggalKeluar: raw.tanggalKeluar ? new Date(raw.tanggalKeluar as string) : null,
    status: (raw.status as string) || "aktif",
    bank: (raw.bank as string) || null,
    noRekening: (raw.noRekening as string) || null,
    npwp: (raw.npwp as string) || null,
    bpjsKesehatan: (raw.bpjsKesehatan as string) || null,
    bpjsKetenagakerjaan: (raw.bpjsKetenagakerjaan as string) || null,
    gajiPokok: parseFloat(raw.gajiPokok as string) || 0,
  }
}

export async function updateKaryawan(id: number, formData: FormData) {
  const raw: Record<string, unknown> = {}
  formData.forEach((val, key) => { raw[key] = val })
  const data = buildUpdateData(raw)

  await prisma.karyawan.update({
    where: { id },
    data,
  })

  revalidatePath("/karyawan")
  revalidatePath(`/karyawan/${id}`)
  redirect(`/karyawan/${id}`)
}

export async function createKaryawan(formData: FormData) {
  const raw: Record<string, unknown> = {}
  formData.forEach((val, key) => { raw[key] = val })
  const data = buildUpdateData(raw)

  await prisma.karyawan.create({
    data: {
      nik: data.nik,
      nama: data.nama,
      email: data.email,
      telepon: data.telepon,
      alamat: data.alamat,
      tempatLahir: data.tempatLahir,
      tanggalLahir: data.tanggalLahir,
      jenisKelamin: data.jenisKelamin,
      agama: data.agama,
      statusNikah: data.statusNikah,
      jumlahTanggungan: data.jumlahTanggungan,
      tanggalMasuk: data.tanggalMasuk,
      tanggalKeluar: data.tanggalKeluar,
      status: data.status,
      bank: data.bank,
      noRekening: data.noRekening,
      npwp: data.npwp,
      bpjsKesehatan: data.bpjsKesehatan,
      bpjsKetenagakerjaan: data.bpjsKetenagakerjaan,
      gajiPokok: data.gajiPokok,
      departemen: { connect: { id: data.departemenId } },
      jabatan: { connect: { id: data.jabatanId } },
    },
  })

  revalidatePath("/karyawan")
  redirect("/karyawan")
}

export async function deleteKaryawan(id: number) {
  await prisma.karyawan.delete({ where: { id } })
  revalidatePath("/karyawan")
  redirect("/karyawan")
}