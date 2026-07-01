import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ─── Default settings ───
const DEFAULTS: Record<string, string> = {
  nama_perusahaan: "PT. Contoh Abadi",
  alamat_perusahaan: "Jl. Merdeka No. 1, Jakarta Pusat",
  npwp_perusahaan: "01.234.567.8-901.000",
  bpjs_kesehatan_rate_karyawan: "1",
  bpjs_kesehatan_rate_perusahaan: "4",
  bpjs_ketenagakerjaan_rate_karyawan: "2",
  bpjs_ketenagakerjaan_rate_perusahaan: "4.54",
  pph21_ptkp_tk0: "54000000",
  pph21_ptkp_tk1: "58500000",
  pph21_ptkp_tk2: "63000000",
  pph21_ptkp_tk3: "67500000",
  pph21_ptkp_k0: "58500000",
  pph21_ptkp_k1: "63000000",
  pph21_ptkp_k2: "67500000",
  pph21_ptkp_k3: "72000000",
  pph21_ptkp_k_i0: "112500000",
  pph21_ptkp_k_i1: "117000000",
  pph21_ptkp_k_i2: "121500000",
  pph21_ptkp_k_i3: "126000000",
  pph21_tarif_layer1: "50000000",
  pph21_tarif_layer1_persen: "5",
  pph21_tarif_layer2: "250000000",
  pph21_tarif_layer2_persen: "15",
  pph21_tarif_layer3: "500000000",
  pph21_tarif_layer3_persen: "25",
  pph21_tarif_layer4_persen: "30",
}

// ─── GET /api/settings ───
export async function GET() {
  try {
    const rows = await prisma.settingPayroll.findMany()
    const map: Record<string, string> = { ...DEFAULTS }
    for (const r of rows) {
      map[r.key] = r.value
    }
    return NextResponse.json(map)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Gagal mengambil pengaturan" }, { status: 500 })
  }
}

// ─── PUT /api/settings ───
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    let settingsToUpsert: Record<string, string> = {}

    // Accept both array format and key-value map
    if (Array.isArray(body.settings)) {
      for (const item of body.settings) {
        settingsToUpsert[item.key] = String(item.value ?? "")
      }
    } else {
      settingsToUpsert = body
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(settingsToUpsert)) {
      if (key && value !== undefined) {
        await prisma.settingPayroll.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      }
    }

    // Return updated settings
    const rows = await prisma.settingPayroll.findMany()
    const map: Record<string, string> = { ...DEFAULTS }
    for (const r of rows) { map[r.key] = r.value }
    return NextResponse.json(map)
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 })
  }
}
