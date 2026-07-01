import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { updateKaryawan } from "../actions"

// ─── Types ───
type Params = Promise<{ id: string }>
type SearchParams = Promise<{ edit?: string }>

// ─── Format helpers ───
function formatDate(d: Date | null | undefined): string {
  if (!d) return ""
  return d.toISOString().split("T")[0]
}

const currency = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)

// ─── SVG Icons ───
function ArrowLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

// ─── Badge ───
const statusBadge: Record<string, string> = {
  aktif: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  nonaktif: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  resign: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
}

// ─── Page ───
export default async function KaryawanDetailPage({
  params,
  searchParams,
}: {
  params: Params
  searchParams: SearchParams
}) {
  const { id } = await params
  const { edit } = await searchParams
  const isEdit = edit === "1"

  const karyawan = await prisma.karyawan.findUnique({
    where: { id: parseInt(id) },
    include: {
      departemen: true,
      jabatan: true,
    },
  })

  if (!karyawan) {
    notFound()
  }

  // Fetch reference data for form selects
  const [departemenList, jabatanList] = await Promise.all([
    prisma.departemen.findMany({ orderBy: { nama: "asc" } }),
    prisma.jabatan.findMany({ orderBy: { nama: "asc" } }),
  ])

  // ── Read-only view ──
  if (!isEdit) {
    return (
      <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Dashboard</Link>
          <span className="text-zinc-700">/</span>
          <Link href="/karyawan" className="hover:text-zinc-300 transition-colors">Karyawan</Link>
          <span className="text-zinc-700">/</span>
          <span className="text-zinc-300 font-medium">{karyawan.nama}</span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/karyawan"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <ArrowLeftIcon />
            </Link>
            <div className="rounded-lg bg-indigo-500/15 p-2.5 ring-1 ring-indigo-500/20">
              <UserIcon />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">{karyawan.nama}</h1>
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${
                    statusBadge[karyawan.status] ?? "bg-zinc-700 text-zinc-300 ring-zinc-600"
                  }`}
                >
                  {karyawan.status}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-0.5">NIK: {karyawan.nik}</p>
            </div>
          </div>
          <Link
            href={`/karyawan/${karyawan.id}?edit=1`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
          >
            <PencilIcon />
            Edit Karyawan
          </Link>
        </div>

        {/* Detail Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identitas */}
          <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">Identitas Diri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <InfoRow label="NIK" value={karyawan.nik} />
              <InfoRow label="Nama Lengkap" value={karyawan.nama} />
              <InfoRow label="Email" value={karyawan.email ?? "—"} />
              <InfoRow label="Telepon" value={karyawan.telepon ?? "—"} />
              <InfoRow label="Tempat Lahir" value={karyawan.tempatLahir ?? "—"} />
              <InfoRow
                label="Tanggal Lahir"
                value={karyawan.tanggalLahir ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(karyawan.tanggalLahir) : "—"}
              />
              <InfoRow label="Jenis Kelamin" value={karyawan.jenisKelamin === "L" ? "Laki-laki" : karyawan.jenisKelamin === "P" ? "Perempuan" : "—"} />
              <InfoRow label="Agama" value={karyawan.agama ?? "—"} />
              <InfoRow label="Status Nikah" value={karyawan.statusNikah ?? "—"} />
              <InfoRow label="Jumlah Tanggungan" value={String(karyawan.jumlahTanggungan)} />
              <div className="md:col-span-2">
                <InfoRow label="Alamat" value={karyawan.alamat ?? "—"} />
              </div>
            </div>
          </div>

          {/* Status Kepegawaian */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">Status Kepegawaian</h2>
            <div className="space-y-3 text-sm">
              <InfoRow label="Departemen" value={karyawan.departemen?.nama ?? "—"} />
              <InfoRow label="Jabatan" value={karyawan.jabatan?.nama ?? "—"} />
              <InfoRow
                label="Tanggal Masuk"
                value={new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(karyawan.tanggalMasuk)}
              />
              <InfoRow
                label="Tanggal Keluar"
                value={karyawan.tanggalKeluar ? new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(karyawan.tanggalKeluar) : "—"}
              />
              <InfoRow label="Status" value={karyawan.status} />
            </div>
          </div>
        </div>

        {/* Keuangan & BPJS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">Informasi Keuangan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <InfoRow label="Gaji Pokok" value={currency(karyawan.gajiPokok)} />
              <InfoRow label="Bank" value={karyawan.bank ?? "—"} />
              <InfoRow label="No. Rekening" value={karyawan.noRekening ?? "—"} />
              <InfoRow label="NPWP" value={karyawan.npwp ?? "—"} />
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">BPJS</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <InfoRow label="BPJS Kesehatan" value={karyawan.bpjsKesehatan ?? "—"} />
              <InfoRow label="BPJS Ketenagakerjaan" value={karyawan.bpjsKetenagakerjaan ?? "—"} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Edit mode ──
  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">Dashboard</Link>
        <span className="text-zinc-700">/</span>
        <Link href="/karyawan" className="hover:text-zinc-300 transition-colors">Karyawan</Link>
        <span className="text-zinc-700">/</span>
        <Link href={`/karyawan/${karyawan.id}`} className="hover:text-zinc-300 transition-colors">{karyawan.nama}</Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-300 font-medium">Edit</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/karyawan/${karyawan.id}`}
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeftIcon />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Edit Karyawan</h1>
          <p className="text-sm text-zinc-400 mt-0.5">{karyawan.nama} — {karyawan.nik}</p>
        </div>
      </div>

      {/* Form */}
      <KaryawanForm
        karyawan={karyawan}
        departemenList={departemenList}
        jabatanList={jabatanList}
        action={updateKaryawan.bind(null, karyawan.id)}
      />
    </div>
  )
}

// ─── Info Row Component ───
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  )
}

// ─── Form Component (server component with server action) ───
type KaryawanFormData = {
  id: number
  nik: string
  nama: string
  email: string | null
  telepon: string | null
  alamat: string | null
  tempatLahir: string | null
  tanggalLahir: Date | null
  jenisKelamin: string | null
  agama: string | null
  statusNikah: string | null
  jumlahTanggungan: number
  departemenId: number
  jabatanId: number
  tanggalMasuk: Date
  tanggalKeluar: Date | null
  status: string
  bank: string | null
  noRekening: string | null
  npwp: string | null
  bpjsKesehatan: string | null
  bpjsKetenagakerjaan: string | null
  gajiPokok: number
}

type RefItem = { id: number; nama: string; departemenId?: number }

async function KaryawanForm({
  karyawan,
  departemenList,
  jabatanList,
  action,
}: {
  karyawan: KaryawanFormData
  departemenList: RefItem[]
  jabatanList: RefItem[]
  action: (formData: FormData) => Promise<void>
}) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Identitas Diri */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">Identitas Diri</h2>
          <div className="space-y-4">
            <FormField label="NIK" name="nik" defaultValue={karyawan.nik} required />
            <FormField label="Nama Lengkap" name="nama" defaultValue={karyawan.nama} required />
            <FormField label="Email" name="email" type="email" defaultValue={karyawan.email ?? ""} />
            <FormField label="Telepon" name="telepon" defaultValue={karyawan.telepon ?? ""} />
            <FormField label="Tempat Lahir" name="tempatLahir" defaultValue={karyawan.tempatLahir ?? ""} />
            <FormField label="Tanggal Lahir" name="tanggalLahir" type="date" defaultValue={formatDate(karyawan.tanggalLahir)} />
            <SelectField
              label="Jenis Kelamin"
              name="jenisKelamin"
              defaultValue={karyawan.jenisKelamin ?? ""}
              options={[
                { value: "", label: "— Pilih —" },
                { value: "L", label: "Laki-laki" },
                { value: "P", label: "Perempuan" },
              ]}
            />
            <FormField label="Agama" name="agama" defaultValue={karyawan.agama ?? ""} />
            <SelectField
              label="Status Nikah"
              name="statusNikah"
              defaultValue={karyawan.statusNikah ?? ""}
              options={[
                { value: "", label: "— Pilih —" },
                { value: "single", label: "Single" },
                { value: "menikah", label: "Menikah" },
                { value: "duda", label: "Duda" },
                { value: "janda", label: "Janda" },
              ]}
            />
            <FormField
              label="Jumlah Tanggungan"
              name="jumlahTanggungan"
              type="number"
              defaultValue={String(karyawan.jumlahTanggungan)}
            />
            <div>
              <label htmlFor="alamat" className="block text-sm font-medium text-zinc-400 mb-1.5">
                Alamat
              </label>
              <textarea
                id="alamat"
                name="alamat"
                rows={3}
                defaultValue={karyawan.alamat ?? ""}
                className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Kepegawaian & Keuangan */}
        <div className="space-y-6">
          {/* Status Kepegawaian */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">Status Kepegawaian</h2>
            <div className="space-y-4">
              <SelectField
                label="Departemen"
                name="departemenId"
                defaultValue={String(karyawan.departemenId)}
                options={[
                  { value: "", label: "— Pilih Departemen —" },
                  ...departemenList.map((d) => ({ value: String(d.id), label: d.nama })),
                ]}
                required
              />
              <SelectField
                label="Jabatan"
                name="jabatanId"
                defaultValue={String(karyawan.jabatanId)}
                options={[
                  { value: "", label: "— Pilih Jabatan —" },
                  ...jabatanList.map((j) => ({ value: String(j.id), label: j.nama })),
                ]}
                required
              />
              <FormField label="Tanggal Masuk" name="tanggalMasuk" type="date" defaultValue={formatDate(karyawan.tanggalMasuk)} required />
              <FormField label="Tanggal Keluar" name="tanggalKeluar" type="date" defaultValue={formatDate(karyawan.tanggalKeluar)} />
              <SelectField
                label="Status"
                name="status"
                defaultValue={karyawan.status}
                options={[
                  { value: "aktif", label: "Aktif" },
                  { value: "nonaktif", label: "Nonaktif" },
                  { value: "resign", label: "Resign" },
                ]}
                required
              />
            </div>
          </div>

          {/* Keuangan */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">Informasi Keuangan</h2>
            <div className="space-y-4">
              <FormField
                label="Gaji Pokok"
                name="gajiPokok"
                type="number"
                step="0.01"
                defaultValue={String(karyawan.gajiPokok)}
                required
              />
              <FormField label="Bank" name="bank" defaultValue={karyawan.bank ?? ""} placeholder="e.g. BCA, Mandiri" />
              <FormField label="No. Rekening" name="noRekening" defaultValue={karyawan.noRekening ?? ""} />
              <FormField label="NPWP" name="npwp" defaultValue={karyawan.npwp ?? ""} />
            </div>
          </div>

          {/* BPJS */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-200 border-b border-zinc-800 pb-3">BPJS</h2>
            <div className="space-y-4">
              <FormField label="BPJS Kesehatan" name="bpjsKesehatan" defaultValue={karyawan.bpjsKesehatan ?? ""} />
              <FormField label="BPJS Ketenagakerjaan" name="bpjsKetenagakerjaan" defaultValue={karyawan.bpjsKetenagakerjaan ?? ""} />
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2 border-t border-zinc-800">
        <button
          type="submit"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
        >
          Simpan Perubahan
        </button>
        <Link
          href={`/karyawan/${karyawan.id}`}
          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl transition-colors"
        >
          Batal
        </Link>
      </div>
    </form>
  )
}

// ─── Form Field Component ───
function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  step,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  step?: string
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-400 mb-1.5">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        step={step}
        required={required}
        className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all text-sm"
      />
    </div>
  )
}

// ─── Select Field Component ───
function SelectField({
  label,
  name,
  defaultValue,
  options,
  required,
}: {
  label: string
  name: string
  defaultValue?: string
  options: { value: string; label: string }[]
  required?: boolean
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-zinc-400 mb-1.5">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all text-sm appearance-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2371717a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: `right 0.75rem center`,
          backgroundRepeat: `no-repeat`,
          backgroundSize: `1.25rem`,
          paddingRight: `2.5rem`,
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
