"use client"

import { useState, useEffect, useCallback } from "react"

type Karyawan = {
  id: number
  nik: string
  nama: string
  departemen: { nama: string } | null
  jabatan: { nama: string } | null
}

type Absensi = {
  id: number
  karyawanId: number
  tanggal: string
  checkIn: string | null
  checkOut: string | null
  status: string
  keterangan: string | null
  karyawan: Karyawan
}

type Session = {
  user: { id?: string; role?: string; name?: string } | null
}

// ─── Status Config ───
const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  hadir: { cls: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30", label: "Hadir" },
  izin:  { cls: "bg-blue-500/15 text-blue-300 ring-blue-500/30",          label: "Izin" },
  sakit: { cls: "bg-amber-500/15 text-amber-300 ring-amber-500/30",      label: "Sakit" },
  cuti:  { cls: "bg-purple-500/15 text-purple-300 ring-purple-500/30",    label: "Cuti" },
  alpha: { cls: "bg-rose-500/15 text-rose-300 ring-rose-500/30",         label: "Alpha" },
}

const STATUS_OPTIONS = ["", "hadir", "izin", "sakit", "cuti", "alpha"]

function fmtTime(d: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric",
  })
}

// ─── Icons ───
const IconClock   = ({ c = "w-5 h-5" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IconLogin   = ({ c = "w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
const IconLogout  = ({ c = "w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const IconX       = ({ c = "w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconRefresh = ({ c = "w-3.5 h-3.5" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
const IconChevronL = ({ c = "w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
const IconChevronR = ({ c = "w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>

// ─── Action Modal ───
interface ActionModalProps {
  action: "checkin" | "checkout"
  karyawan: Karyawan[]
  onClose: () => void
  onSuccess: () => void
}

function ActionModal({ action, karyawan, onClose, onSuccess }: ActionModalProps) {
  const [karyawanId, setKaryawanId] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!karyawanId) { setError("Pilih karyawan terlebih dahulu"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/absensi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, karyawanId: Number(karyawanId) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan")
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
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-base font-semibold text-zinc-100">
            {action === "checkin" ? "Check In Karyawan" : "Check Out Karyawan"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition">
            <IconX />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Pilih Karyawan <span className="text-rose-400">*</span>
              </label>
              <select
                value={karyawanId}
                onChange={e => setKaryawanId(e.target.value)}
                className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="">-- Pilih Karyawan --</option>
                {karyawan.map(k => (
                  <option key={k.id} value={k.id}>{k.nama} ({k.nik}) — {k.departemen?.nama ?? "—"}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition">
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 ${
                action === "checkin" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {saving ? "Memproses..." : action === "checkin" ? "Check In Sekarang" : "Check Out Sekarang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ───
export default function AbsensiPage() {
  const [data, setData] = useState<Absensi[]>([])
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const PER_PAGE = 20

  // Filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate]   = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Modal
  const [actionModal, setActionModal] = useState<"checkin" | "checkout" | null>(null)

  const fetchKaryawan = useCallback(async () => {
    try {
      const res = await fetch("/api/karyawan")
      if (res.ok) setKaryawanList(await res.json())
    } catch (_) {}
  }, [])

  const fetchAbsensi = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (startDate) params.set("startDate", startDate)
      if (endDate)   params.set("endDate", endDate)
      if (statusFilter) params.set("status", statusFilter)
      params.set("limit", String(PER_PAGE))
      params.set("page", String(page))
      const res = await fetch(`/api/absensi?${params}`)
      if (!res.ok) throw new Error("Gagal memuat data")
      const json = await res.json()
      setData(json.data || json)
      setTotal(json.total || json.length || 0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, statusFilter, page])

  useEffect(() => { fetchKaryawan() }, [fetchKaryawan])
  useEffect(() => { fetchAbsensi() }, [fetchAbsensi])

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8 space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/15 p-2.5 ring-1 ring-indigo-500/20">
            <IconClock c="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Absensi</h1>
            <p className="text-sm text-zinc-400 mt-0.5">{total} record</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActionModal("checkin")}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <IconLogin /> Check In
          </button>
          <button
            onClick={() => setActionModal("checkout")}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <IconLogout /> Check Out
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-200 transition"><IconX /></button>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400">Dari:</label>
          <input
            type="date"
            value={startDate}
            onChange={e => { setStartDate(e.target.value); setPage(1) }}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-100 transition focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400">Sampai:</label>
          <input
            type="date"
            value={endDate}
            onChange={e => { setEndDate(e.target.value); setPage(1) }}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-100 transition focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-zinc-400">Status:</label>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs text-zinc-100 transition focus:border-indigo-500 focus:outline-none"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s === "" ? "Semua" : STATUS_MAP[s]?.label}</option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={fetchAbsensi} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200">
            <IconRefresh /> Refresh
          </button>
          {(startDate || endDate || statusFilter) && (
            <button
              onClick={() => { setStartDate(""); setEndDate(""); setStatusFilter(""); setPage(1) }}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
            >
              <IconX /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500">
                <th className="py-4 pl-5 pr-4 font-medium">Tanggal</th>
                <th className="py-4 px-4 font-medium">NIK</th>
                <th className="py-4 px-4 font-medium">Nama</th>
                <th className="py-4 px-4 font-medium">Departemen</th>
                <th className="py-4 px-4 font-medium text-center">Jam Masuk</th>
                <th className="py-4 px-4 font-medium text-center">Jam Pulang</th>
                <th className="py-4 px-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-zinc-500 italic">Memuat data...</td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-zinc-500 italic">
                    {startDate || endDate || statusFilter ? "Tidak ada data sesuai filter." : "Belum ada data absensi."}
                  </td>
                </tr>
              ) : (
                data.map(item => {
                  const badge = STATUS_MAP[item.status] ?? { cls: "bg-zinc-700 text-zinc-300", label: item.status }
                  return (
                    <tr key={item.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                      <td className="py-4 pl-5 pr-4 text-zinc-300 text-xs whitespace-nowrap">{fmtDate(item.tanggal)}</td>
                      <td className="py-4 px-4 font-mono text-xs text-zinc-400">{item.karyawan.nik}</td>
                      <td className="py-4 px-4 font-medium text-zinc-200">{item.karyawan.nama}</td>
                      <td className="py-4 px-4 text-zinc-400">{item.karyawan.departemen?.nama ?? "—"}</td>
                      <td className="py-4 px-4 text-center font-mono text-sm text-zinc-200">{fmtTime(item.checkIn)}</td>
                      <td className="py-4 px-4 text-center font-mono text-sm text-zinc-200">{fmtTime(item.checkOut)}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {total > PER_PAGE && (
          <div className="border-t border-zinc-800 px-5 py-3 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Menampilkan {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} dari {total} data
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <IconChevronL />
              </button>
              <span className="px-3 py-1 text-xs text-zinc-300">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <IconChevronR />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {actionModal && (
        <ActionModal
          action={actionModal}
          karyawan={karyawanList}
          onClose={() => setActionModal(null)}
          onSuccess={() => {
            setActionModal(null)
            fetchAbsensi()
          }}
        />
      )}
    </div>
  )
}
