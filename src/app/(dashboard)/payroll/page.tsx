"use client"

import { useState, useEffect, useCallback } from "react"

type Karyawan = {
  id: number; nik: string; nama: string
  departemen: { nama: string } | null; jabatan: { nama: string } | null
  gajiPokok: number
}
type Payroll = {
  id: number; karyawanId: number; periodeBulan: number; periodeTahun: number
  gajiPokok: number; totalTunjangan: number; totalLembur: number; totalPotongan: number
  bpjsKesehatan: number; bpjsKetenagakerjaan: number; pph21: number; thr: number; pinjaman: number
  totalPenerimaan: number; totalPengurangan: number; gajiBersih: number; status: string
  createdAt: string; karyawan: Karyawan
}

// ─── Helpers ───
const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
const fmtBulan = (b: number, t: number) => new Date(t, b - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-zinc-600/20 text-zinc-300 ring-zinc-600/30",
  dikonfirmasi: "bg-blue-500/20 text-blue-300 ring-blue-500/30",
  dibayar: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30",
}
const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]

// ─── Icons ───
const IconPay = ({ c="w-5 h-5" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
const IconPlus  = ({ c="w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconX     = ({ c="w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconCheck = ({ c="w-3.5 h-3.5" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const IconEye   = ({ c="w-3.5 h-3.5" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
const IconDownload = ({ c="w-3.5 h-3.5" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IconRefresh = ({ c="w-3.5 h-3.5" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
const IconInfo = ({ c="w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>

// ─── Create Payroll Modal ───
interface CreateModalProps {
  karyawan: Karyawan[]
  onClose: () => void
  onSuccess: () => void
}

function CreateModal({ karyawan, onClose, onSuccess }: CreateModalProps) {
  const now = new Date()
  const [bulan, setBulan]   = useState(String(now.getMonth() + 1))
  const [tahun, setTahun]   = useState(String(now.getFullYear()))
  const [selections, setSelections] = useState<Record<number, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // Calculate per employee
  const calcFor = (k: Karyawan) => {
    const gp = k.gajiPokok || 0
    const bpjsKs = Math.min(gp * 0.01, 120000)
    const bpjsTk = gp * 0.02
    const pph21 = 0 // placeholder - real calc uses PTKP
    return { gp, bpjsKs, bpjsTk, pph21 }
  }

  const toggleKaryawan = (id: number) => {
    setSelections(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    const selected = Object.entries(selections).filter(([, v]) => v).map(([id]) => Number(id))
    if (selected.length === 0) { setError("Pilih minimal 1 karyawan"); return }
    setSaving(true)
    setError("")
    try {
      const items = selected.map(kid => {
        const k = karyawan.find(x => x.id === kid)!
        const c = calcFor(k)
        return {
          karyawanId: kid,
          periodeBulan: Number(bulan),
          periodeTahun: Number(tahun),
          totalTunjangan: 0,
          totalLembur: 0,
          totalPotongan: 0,
          bpjsKesehatan: c.bpjsKs,
          bpjsKetenagakerjaan: c.bpjsTk,
          pph21: c.pph21,
        }
      })
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan")
      setSuccessMsg(json.message)
      setTimeout(() => { onSuccess() }, 1200)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  const selectedCount = Object.values(selections).filter(Boolean).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 shrink-0">
          <h2 className="text-base font-semibold text-zinc-100">Buat Payroll Periode</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition"><IconX /></button>
        </div>

        {successMsg ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 mb-3"><IconCheck c="w-6 h-6 text-emerald-400" /></div>
              <p className="text-emerald-300 font-medium">{successMsg}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-zinc-800 shrink-0">
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Bulan</label>
                  <select value={bulan} onChange={e => setBulan(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none">
                    {BULAN.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Tahun</label>
                  <select value={tahun} onChange={e => setTahun(e.target.value)} className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none">
                    {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button onClick={() => setSelections(Object.fromEntries(karyawan.map(k => [k.id, true])))} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition">Pilih Semua</button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}
              {karyawan.length === 0 ? (
                <p className="text-sm text-zinc-500 italic text-center py-6">Tidak ada karyawan.</p>
              ) : (
                <div className="space-y-2">
                  {karyawan.map(k => {
                    const c = calcFor(k)
                    const sel = selections[k.id]
                    return (
                      <div key={k.id} className="space-y-1">
                        <div onClick={() => toggleKaryawan(k.id)}
                          className={`flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-all ${
                            sel ? "border-indigo-500/40 bg-indigo-500/8" : "border-zinc-800 bg-zinc-800/20 hover:border-zinc-700"
                          }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${sel ? "bg-indigo-600 border-indigo-600" : "border-zinc-600"}`}>
                              {sel && <IconCheck c="w-3 h-3 text-white" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-200">{k.nama}</p>
                              <p className="text-xs text-zinc-500">{k.departemen?.nama ?? "—"} · {k.jabatan?.nama ?? "—"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="pl-10 pr-4 pb-2 grid grid-cols-3 gap-2 text-xs text-zinc-400">
                          <div>Gaji Pokok: <span className="text-zinc-200 font-mono">{fmt(c.gp)}</span></div>
                          <div>BPJS KS (1%): <span className="text-zinc-200 font-mono">{fmt(c.bpjsKs)}</span></div>
                          <div>BPJS TK (2%): <span className="text-zinc-200 font-mono">{fmt(c.bpjsTk)}</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4 shrink-0">
              <span className="text-sm text-zinc-400">{selectedCount} karyawan dipilih</span>
              <div className="flex gap-3">
                <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition">Batal</button>
                <button onClick={handleSave} disabled={saving || selectedCount === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  {saving ? "Menyimpan..." : `Simpan Payroll`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Detail Modal ───
function DetailModal({ payroll, onClose }: { payroll: Payroll; onClose: () => void }) {
  const [updating, setUpdating] = useState(false)
  const [error, setError]       = useState("")

  const handleStatus = async (newStatus: string) => {
    setUpdating(true)
    setError("")
    try {
      const res = await fetch(`/api/payroll/${payroll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) { const json = await res.json(); throw new Error(json.error) }
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{payroll.karyawan.nama}</h2>
            <p className="text-xs text-zinc-500">{fmtBulan(payroll.periodeBulan, payroll.periodeTahun)}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition"><IconX /></button>
        </div>

        <div className="px-6 py-5 space-y-3">
          {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}

          {/* Rincian */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Penerimaan</h3>
            {[
              ["Gaji Pokok", payroll.gajiPokok],
              ["Tunjangan", payroll.totalTunjangan],
              ["Lembur", payroll.totalLembur],
              ["THR", payroll.thr],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between text-sm">
                <span className="text-zinc-400">{String(label)}</span>
                <span className="font-mono text-zinc-200">{fmt(Number(val))}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-medium border-t border-zinc-800 pt-2">
              <span className="text-zinc-300">Total Penerimaan</span>
              <span className="font-mono text-emerald-400">{fmt(payroll.totalPenerimaan)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Potongan</h3>
            {[
              ["BPJS Kesehatan", payroll.bpjsKesehatan],
              ["BPJS Ketenagakerjaan", payroll.bpjsKetenagakerjaan],
              ["PPh 21", payroll.pph21],
              ["Pinjaman", payroll.pinjaman],
              ["Potongan Lain", payroll.totalPotongan],
            ].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between text-sm">
                <span className="text-zinc-400">{String(label)}</span>
                <span className="font-mono text-zinc-200">{fmt(Number(val))}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-medium border-t border-zinc-800 pt-2">
              <span className="text-zinc-300">Total Potongan</span>
              <span className="font-mono text-rose-400">{fmt(payroll.totalPengurangan)}</span>
            </div>
          </div>

          <div className="flex justify-between rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-4 py-3 text-sm font-semibold">
            <span className="text-indigo-200">Gaji Bersih</span>
            <span className="font-mono text-indigo-300">{fmt(payroll.gajiBersih)}</span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${STATUS_BADGE[payroll.status]}`}>{payroll.status}</span>
            <span className="text-xs text-zinc-600">·</span>
            <span className="text-xs text-zinc-500">NIK: {payroll.karyawan.nik}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
          {payroll.status === "draft" && (
            <button onClick={() => handleStatus("dikonfirmasi")} disabled={updating}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-50">
              <IconCheck c="w-3.5 h-3.5" /> Konfirmasi
            </button>
          )}
          {payroll.status === "dikonfirmasi" && (
            <button onClick={() => handleStatus("dibayar")} disabled={updating}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50">
              <IconCheck c="w-3.5 h-3.5" /> Tandai Dibayar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main ───
export default function PayrollPage() {
  const [data, setData]         = useState<Payroll[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")
  const [selectedBulan, setBulan] = useState(String(new Date().getMonth() + 1))
  const [selectedTahun, setTahun] = useState(String(new Date().getFullYear()))
  const [karyawan, setKaryawan]   = useState<Karyawan[]>([])
  const [detailPayroll, setDetailPayroll] = useState<Payroll | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const fetchPayroll = useCallback(async () => {
    setLoading(true); setError("")
    try {
      const params = new URLSearchParams({ bulan: selectedBulan, tahun: selectedTahun })
      const res = await fetch(`/api/payroll?${params}`)
      if (!res.ok) throw new Error("Gagal memuat data")
      setData(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [selectedBulan, selectedTahun])

  const fetchKaryawan = useCallback(async () => {
    try {
      const res = await fetch("/api/karyawan")
      if (res.ok) setKaryawan(await res.json())
    } catch (_) {}
  }, [])

  useEffect(() => { fetchKaryawan() }, [fetchKaryawan])
  useEffect(() => { fetchPayroll() }, [fetchPayroll])

  // Summary stats
  const totalGp     = data.reduce((s, p) => s + p.gajiPokok, 0)
  const totalTunj   = data.reduce((s, p) => s + p.totalTunjangan, 0)
  const totalPot    = data.reduce((s, p) => s + p.totalPengurangan, 0)
  const totalBersih = data.reduce((s, p) => s + p.gajiBersih, 0)

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/15 p-2.5 ring-1 ring-indigo-500/20"><IconPay c="w-6 h-6 text-indigo-400" /></div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
            <p className="text-sm text-zinc-400 mt-0.5">{fmtBulan(Number(selectedBulan), Number(selectedTahun))} · {data.length} karyawan</p>
          </div>
        </div>
        <button onClick={() => setCreateOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
          <IconPlus /> Buat Payroll
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-zinc-400">Periode:</label>
          <select value={selectedBulan} onChange={e => setBulan(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none">
            {BULAN.map((b, i) => <option key={i} value={i + 1}>{b}</option>)}
          </select>
          <select value={selectedTahun} onChange={e => setTahun(e.target.value)}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none">
            {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={fetchPayroll} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200">
          <IconRefresh /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Gaji Pokok",  val: fmt(totalGp),     cls: "text-zinc-200" },
          { label: "Total Tunjangan",    val: fmt(totalTunj),   cls: "text-sky-300" },
          { label: "Total Potongan",     val: fmt(totalPot),    cls: "text-rose-300" },
          { label: "Total Gaji Bersih",  val: fmt(totalBersih), cls: "text-emerald-300" },
        ].map(({ label, val, cls }) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-xs text-zinc-500 mb-1">{label}</p>
            <p className={`text-lg font-bold font-mono ${cls}`}>{val}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-400 hover:text-rose-200 transition"><IconX /></button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-500">
                <th className="py-4 pl-5 pr-4 font-medium">Nama</th>
                <th className="py-4 px-4 font-medium">NIK</th>
                <th className="py-4 px-4 font-medium text-right">Gaji Pokok</th>
                <th className="py-4 px-4 font-medium text-right">Tunjangan</th>
                <th className="py-4 px-4 font-medium text-right">Potongan</th>
                <th className="py-4 px-4 font-medium text-right">Gaji Bersih</th>
                <th className="py-4 px-4 font-medium text-center">Status</th>
                <th className="py-4 px-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-zinc-500 italic">Memuat...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-sm text-zinc-500 italic">Belum ada data payroll untuk periode ini. Klik "Buat Payroll" untuk memulai.</td></tr>
              ) : (
                data.map((p, i) => (
                  <tr key={p.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                    <td className="py-4 pl-5 pr-4 font-medium text-zinc-200">{p.karyawan.nama}</td>
                    <td className="py-4 px-4 font-mono text-xs text-zinc-400">{p.karyawan.nik}</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-zinc-200">{fmt(p.gajiPokok)}</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-sky-300">{fmt(p.totalTunjangan)}</td>
                    <td className="py-4 px-4 text-right font-mono text-sm text-rose-300">{fmt(p.totalPengurangan)}</td>
                    <td className="py-4 px-4 text-right font-mono text-sm font-semibold text-emerald-300">{fmt(p.gajiBersih)}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${STATUS_BADGE[p.status]}`}>{p.status}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setDetailPayroll(p)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition" title="Detail">
                          <IconEye />
                        </button>
                        <button className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition" title="Download">
                          <IconDownload />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {createOpen && <CreateModal karyawan={karyawan} onClose={() => setCreateOpen(false)} onSuccess={() => { setCreateOpen(false); fetchPayroll() }} />}
      {detailPayroll && <DetailModal payroll={detailPayroll} onClose={() => { setDetailPayroll(null); fetchPayroll() }} />}
    </div>
  )
}
