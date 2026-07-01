"use client"

import { useState, useEffect, useCallback } from "react"

// ─── Types ───
type Karyawan = {
  id: number
  nik: string
  nama: string
  departemen: { nama: string } | null
  jabatan: { nama: string } | null
}

type CutiApproval = {
  id: number
  userId: number
  tingkat: number
  status: string
  catatan: string | null
  createdAt: string
  user: { id: number; nama: string; role: string }
}

type Cuti = {
  id: number
  karyawanId: number
  jenis: string
  tanggalMulai: string
  tanggalSelesai: string
  alasan: string
  status: string
  createdAt: string
  updatedAt: string
  karyawan: Karyawan
  approvals: CutiApproval[]
}

type Session = {
  user: {
    id?: string
    role?: string
    name?: string
  } | null
}

// ─── Status Badge Map ───
const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  menunggu: {
    cls: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    label: "Menunggu",
  },
  disetujui: {
    cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    label: "Disetujui",
  },
  ditolak: {
    cls: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
    label: "Ditolak",
  },
}

const JENIS_CUTI: Record<string, string> = {
  tahunan: "Cuti Tahunan",
  sakit: "Cuti Sakit",
  melahirkan: "Cuti Melahirkan",
  pernikahan: "Cuti Pernikahan",
}

// ─── Inline SVG Icons ───
const IconPlus = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconX = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconCheck = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconBan = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
)
const IconCalendar = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)
const IconRefresh = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)
const IconInfo = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
)

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function calcDays(mulai: string, selesai: string) {
  const a = new Date(mulai)
  const b = new Date(selesai)
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

// ─── Form Modal ───
interface FormModalProps {
  karyawan: Karyawan[]
  session: Session | null
  onClose: () => void
  onSuccess: () => void
}

function FormModal({ karyawan, onClose, onSuccess }: FormModalProps) {
  const [karyawanId, setKaryawanId] = useState("")
  const [jenis, setJenis] = useState("tahunan")
  const [tanggalMulai, setTanggalMulai] = useState("")
  const [tanggalSelesai, setTanggalSelesai] = useState("")
  const [alasan, setAlasan] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!karyawanId || !tanggalMulai || !tanggalSelesai || !alasan.trim()) {
      setError("Semua field harus diisi")
      return
    }

    const mulai = new Date(tanggalMulai)
    const selesai = new Date(tanggalSelesai)
    if (selesai < mulai) {
      setError("Tanggal selesai tidak boleh sebelum tanggal mulai")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/cuti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          karyawanId: Number(karyawanId),
          jenis,
          tanggalMulai,
          tanggalSelesai,
          alasan: alasan.trim(),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menyimpan")
      }
      onSuccess()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-100">Ajukan Cuti Baru</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            )}

            {/* Karyawan Select */}
            <div>
              <label htmlFor="karyawanId" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Karyawan <span className="text-rose-400">*</span>
              </label>
              <select
                id="karyawanId"
                value={karyawanId}
                onChange={(e) => setKaryawanId(e.target.value)}
                className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="">-- Pilih Karyawan --</option>
                {karyawan.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama} ({k.nik})
                  </option>
                ))}
              </select>
            </div>

            {/* Jenis Cuti */}
            <div>
              <label htmlFor="jenis" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Jenis Cuti <span className="text-rose-400">*</span>
              </label>
              <select
                id="jenis"
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              >
                {Object.entries(JENIS_CUTI).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Tanggal */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tanggalMulai" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Tanggal Mulai <span className="text-rose-400">*</span>
                </label>
                <input
                  id="tanggalMulai"
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
              <div>
                <label htmlFor="tanggalSelesai" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Tanggal Selesai <span className="text-rose-400">*</span>
                </label>
                <input
                  id="tanggalSelesai"
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            {/* Alasan */}
            <div>
              <label htmlFor="alasan" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Alasan <span className="text-rose-400">*</span>
              </label>
              <textarea
                id="alasan"
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Jelaskan alasan pengajuan cuti..."
                rows={3}
                className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
            >
              {saving ? "Mengirim..." : "Ajukan Cuti"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Approval Modal ───
interface ApprovalModalProps {
  cuti: Cuti
  onClose: () => void
  onSuccess: () => void
}

function ApprovalModal({ cuti, onClose, onSuccess }: ApprovalModalProps) {
  const [status, setStatus] = useState("disetujui")
  const [catatan, setCatatan] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)

    try {
      const res = await fetch(`/api/cuti/${cuti.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, catatan: catatan.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal memproses")
      }
      onSuccess()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-100">Proses Persetujuan Cuti</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Preview info */}
        <div className="px-6 py-4 space-y-2 border-b border-zinc-800">
          <p className="text-sm font-medium text-zinc-200">{cuti.karyawan.nama}</p>
          <p className="text-xs text-zinc-400">
            {JENIS_CUTI[cuti.jenis]} · {formatDate(cuti.tanggalMulai)} – {formatDate(cuti.tanggalSelesai)}
            <span className="ml-2 inline-flex items-center rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
              {calcDays(cuti.tanggalMulai, cuti.tanggalSelesai)} hari
            </span>
          </p>
          <p className="text-xs text-zinc-500 italic">"{cuti.alasan}"</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Keputusan <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStatus("disetujui")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    status === "disetujui"
                      ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
                      : "border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  <IconCheck /> Setuju
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("ditolak")}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                    status === "ditolak"
                      ? "border-rose-500/50 bg-rose-500/15 text-rose-300"
                      : "border-zinc-700 bg-zinc-800/40 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                  }`}
                >
                  <IconBan /> Tolak
                </button>
              </div>
            </div>

            {/* Catatan */}
            <div>
              <label htmlFor="catatan" className="block text-sm font-medium text-zinc-300 mb-1.5">
                Catatan {status === "ditolak" && <span className="text-rose-400">*</span>}
              </label>
              <textarea
                id="catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder={status === "ditolak" ? "Wajib填写 alasan penolakan..." : "Catatan opsional..."}
                rows={3}
                className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 ${
                status === "disetujui"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-rose-600 hover:bg-rose-500 text-white"
              }`}
            >
              {saving ? "Memproses..." : status === "disetujui" ? "Setujui Cuti" : "Tolak Cuti"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ───
export default function CutiPage() {
  const [data, setData] = useState<Cuti[]>([])
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  // Modal state
  const [formOpen, setFormOpen] = useState(false)
  const [approvalTarget, setApprovalTarget] = useState<Cuti | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)

  // ── Fetch session ──
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session")
      const json = await res.json()
      setSession(json)
    } catch (_) {}
  }, [])

  // ── Fetch cuti list ──
  const fetchCuti = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const url = filterStatus ? `/api/cuti?status=${filterStatus}` : "/api/cuti"
      const res = await fetch(url)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal memuat data")
      }
      const json = await res.json()
      setData(json)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  // ── Fetch karyawan list for form ──
  const fetchKaryawan = useCallback(async () => {
    try {
      const res = await fetch("/api/karyawan")
      if (res.ok) {
        const json = await res.json()
        setKaryawanList(json)
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    fetchSession()
    fetchKaryawan()
  }, [fetchSession, fetchKaryawan])

  useEffect(() => {
    fetchCuti()
  }, [fetchCuti])

  // ── Check if user can approve ──
  const userRole = session?.user?.role?.toLowerCase() ?? ""
  const canApprove = ["admin", "hrd"].includes(userRole)

  // ── Quick approve / reject (no modal) ──
  const handleQuickAction = async (cuti: Cuti, action: "disetujui" | "ditolak") => {
    setProcessingId(cuti.id)
    try {
      const res = await fetch(`/api/cuti/${cuti.id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal memproses")
      }
      await fetchCuti()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setProcessingId(null)
    }
  }

  // ── Render ──
  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8 space-y-8">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/15 p-2.5 ring-1 ring-indigo-500/20">
            <IconCalendar className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pengajuan Cuti</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {data.length} pengajuan cuti
              {filterStatus && ` · difilter: ${STATUS_BADGE[filterStatus]?.label}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <IconPlus />
          Ajukan Cuti
        </button>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-200 transition">
            <IconX className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-zinc-400">Filter:</span>
        {["", "menunggu", "disetujui", "ditolak"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              filterStatus === s
                ? "bg-indigo-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            }`}
          >
            {s === "" ? "Semua" : STATUS_BADGE[s]?.label}
          </button>
        ))}

        <div className="ml-auto">
          <button
            onClick={fetchCuti}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
          >
            <IconRefresh className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500">
                <th className="py-4 pl-5 pr-4 font-medium">Karyawan</th>
                <th className="py-4 px-4 font-medium">Jenis</th>
                <th className="py-4 px-4 font-medium">Periode</th>
                <th className="py-4 px-4 font-medium text-center">Durasi</th>
                <th className="py-4 px-4 font-medium">Alasan</th>
                <th className="py-4 px-4 font-medium text-center">Status</th>
                <th className="py-4 px-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-zinc-500 italic">
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-zinc-500 italic">
                    {filterStatus
                      ? `Tidak ada pengajuan cuti dengan status "${STATUS_BADGE[filterStatus]?.label}".`
                      : "Belum ada pengajuan cuti."}
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const badge = STATUS_BADGE[item.status] ?? { cls: "bg-zinc-700 text-zinc-300", label: item.status }
                  const days = calcDays(item.tanggalMulai, item.tanggalSelesai)
                  const isPending = item.status === "menunggu"

                  return (
                    <tr key={item.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                      {/* Karyawan */}
                      <td className="py-4 pl-5 pr-4">
                        <div className="font-medium text-zinc-200">{item.karyawan.nama}</div>
                        <div className="text-xs text-zinc-500">{item.karyawan.departemen?.nama ?? "—"} · {item.karyawan.jabatan?.nama ?? "—"}</div>
                        <div className="text-xs text-zinc-600 font-mono">{item.karyawan.nik}</div>
                      </td>

                      {/* Jenis */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-300 ring-1 ring-inset ring-sky-500/30">
                          {JENIS_CUTI[item.jenis] ?? item.jenis}
                        </span>
                      </td>

                      {/* Periode */}
                      <td className="py-4 px-4">
                        <div className="text-zinc-200 text-xs">{formatDate(item.tanggalMulai)}</div>
                        <div className="text-zinc-500 text-xs">s/d {formatDate(item.tanggalSelesai)}</div>
                      </td>

                      {/* Durasi */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] rounded-full bg-indigo-500/15 px-2.5 py-0.5 text-xs font-bold text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
                          {days} d
                        </span>
                      </td>

                      {/* Alasan */}
                      <td className="py-4 px-4 max-w-[200px]">
                        <p className="text-zinc-400 text-xs truncate" title={item.alasan}>
                          {item.alasan}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${badge.cls}`}>
                          {badge.label}
                        </span>
                        {item.approvals.length > 0 && (
                          <div className="mt-1">
                            {item.approvals.map((a) => (
                              <div key={a.id} className="flex items-center gap-1 text-xs text-zinc-500">
                                <span className={a.status === "disetujui" ? "text-emerald-400" : "text-rose-400"}>
                                  {a.status === "disetujui" ? <IconCheck className="w-3 h-3 inline" /> : <IconBan className="w-3 h-3 inline" />}
                                </span>
                                <span>{a.user.nama}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {canApprove && isPending ? (
                            <>
                              <button
                                onClick={() => handleQuickAction(item, "disetujui")}
                                disabled={processingId === item.id}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600/20 px-2.5 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-600/30 disabled:opacity-50"
                                title="Setujui"
                              >
                                <IconCheck />
                                Setuju
                              </button>
                              <button
                                onClick={() => handleQuickAction(item, "ditolak")}
                                disabled={processingId === item.id}
                                className="inline-flex items-center gap-1 rounded-md bg-rose-600/20 px-2.5 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-600/30 disabled:opacity-50"
                                title="Tolak"
                              >
                                <IconBan />
                                Tolak
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-zinc-600 italic">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {data.length > 0 && (
          <div className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500 flex items-center gap-4">
            <span>Menampilkan {data.length} pengajuan</span>
            <div className="flex items-center gap-1.5">
              <IconInfo className="w-3.5 h-3.5 text-zinc-600" />
              <span className="text-zinc-600">
                Menunggu: {data.filter((d) => d.status === "menunggu").length}
                {" · "}
                Disetujui: {data.filter((d) => d.status === "disetujui").length}
                {" · "}
                Ditolak: {data.filter((d) => d.status === "ditolak").length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {formOpen && (
        <FormModal
          karyawan={karyawanList}
          session={session}
          onClose={() => setFormOpen(false)}
          onSuccess={() => {
            setFormOpen(false)
            fetchCuti()
          }}
        />
      )}

      {approvalTarget && (
        <ApprovalModal
          cuti={approvalTarget}
          onClose={() => setApprovalTarget(null)}
          onSuccess={() => {
            setApprovalTarget(null)
            fetchCuti()
          }}
        />
      )}
    </div>
  )
}