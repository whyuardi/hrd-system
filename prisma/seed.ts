import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@hrd.com" },
    update: {},
    create: {
      email: "admin@hrd.com",
      password: hashedPassword,
      nama: "Admin HRD",
      role: "admin",
    },
  })
  console.log(`✅ Admin user: ${admin.email} (password: admin123)`)

  // Create departemen
  const deps = ["IT", "HRD", "Keuangan", "Marketing", "Operasional"]
  for (const nama of deps) {
    await prisma.departemen.upsert({
      where: { nama },
      update: {},
      create: { nama, deskripsi: `Departemen ${nama}` },
    })
  }
  console.log(`✅ ${deps.length} departemen created`)

  // Create jabatan
  const it = await prisma.departemen.findUnique({ where: { nama: "IT" } })
  const hrd = await prisma.departemen.findUnique({ where: { nama: "HRD" } })

  if (it && hrd) {
    const jabatans = [
      { nama: "Kepala IT", departemenId: it.id },
      { nama: "Programmer", departemenId: it.id },
      { nama: "IT Support", departemenId: it.id },
      { nama: "Kepala HRD", departemenId: hrd.id },
      { nama: "Staff HRD", departemenId: hrd.id },
    ]
    for (const j of jabatans) {
      await prisma.jabatan.upsert({
        where: { nama_departemenId: { nama: j.nama, departemenId: j.departemenId } },
        update: {},
        create: j,
      })
    }
  }
  console.log(`✅ Jabatan created`)

  // Create sample karyawan
  const adminUser = await prisma.user.findUnique({ where: { email: "admin@hrd.com" } })
  const programmer = await prisma.jabatan.findFirst({ where: { nama: "Programmer" } })
  const staffHrd = await prisma.jabatan.findFirst({ where: { nama: "Staff HRD" } })

  if (adminUser && programmer) {
    await prisma.karyawan.upsert({
      where: { nik: "EMP001" },
      update: {},
      create: {
        userId: adminUser.id,
        nik: "EMP001",
        nama: "Admin HRD",
        email: "admin@hrd.com",
        departemenId: it!.id,
        jabatanId: programmer.id,
        gajiPokok: 7500000,
        tanggalMasuk: new Date("2024-01-01"),
        status: "aktif",
        bank: "BCA",
        noRekening: "1234567890",
        npwp: "12.345.678.9-012.000",
        bpjsKesehatan: "0000123456",
        bpjsKetenagakerjaan: "BPJS-TK-001",
      },
    })
  }

  if (staffHrd && hrd) {
    await prisma.karyawan.upsert({
      where: { nik: "EMP002" },
      update: {},
      create: {
        nik: "EMP002",
        nama: "Siti Rahayu",
        email: "siti@hrd.com",
        departemenId: hrd.id,
        jabatanId: staffHrd.id,
        gajiPokok: 5000000,
        tanggalMasuk: new Date("2024-03-15"),
        status: "aktif",
        bank: "Mandiri",
        noRekening: "9876543210",
      },
    })
  }
  console.log(`✅ Sample karyawan created`)

  // Set default payroll settings
  const settings = [
    { key: "bpjs_kesehatan_persen", value: "1", label: "BPJS Kesehatan (% dari gaji)" },
    { key: "bpjs_ketenagakerjaan_persen", value: "2", label: "BPJS Ketenagakerjaan (% dari gaji)" },
    { key: "jam_kerja_per_hari", value: "8", label: "Jam Kerja per Hari" },
    { key: "hari_kerja_per_bulan", value: "22", label: "Hari Kerja per Bulan" },
    { key: "pph21_metode", value: "TER", label: "Metode PPh 21 (TER/NETO)" },
    { key: "ptkp_status", value: "TK/0", label: "PTKP Default" },
  ]
  for (const s of settings) {
    await prisma.settingPayroll.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    })
  }
  console.log(`✅ Settings created`)

  // Default komponen gaji
  const komponenGaji = [
    { nama: "Gaji Pokok", jenis: "penerimaan", isPersentase: false, nilai: 0 },
    { nama: "Tunjangan Jabatan", jenis: "penerimaan", isPersentase: false, nilai: 500000 },
    { nama: "Tunjangan Makan", jenis: "penerimaan", isPersentase: false, nilai: 500000 },
    { nama: "Tunjangan Transport", jenis: "penerimaan", isPersentase: false, nilai: 300000 },
    { nama: "Lembur", jenis: "penerimaan", isPersentase: false, nilai: 25000 },
    { nama: "THR", jenis: "penerimaan", isPersentase: false, nilai: 0 },
    { nama: "Potongan Keterlambatan", jenis: "potongan", isPersentase: false, nilai: 50000 },
    { nama: "Potongan Pinjaman", jenis: "potongan", isPersentase: false, nilai: 0 },
    { nama: "BPJS Kesehatan", jenis: "potongan", isPersentase: true, nilai: 1 },
    { nama: "BPJS Ketenagakerjaan", jenis: "potongan", isPersentase: true, nilai: 2 },
    { nama: "PPh 21", jenis: "potongan", isPersentase: false, nilai: 0 },
  ]
  for (const k of komponenGaji) {
    await prisma.komponenGaji.upsert({
      where: { nama: k.nama },
      update: {},
      create: k,
    })
  }
  console.log(`✅ Komponen gaji created`)

  console.log("\n🎉 Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
