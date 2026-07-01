"use client"

import { useState, useEffect, useCallback } from "react"

type ReportType = "absensi" | "payroll" | "bpjs" | "pph21"

type RekapAbsensi = {
  karyawanId: number; nama: string; nik: string
  totalHadir: number; totalIzin: number; totalSakit: number; totalCuti: number; totalAlpha: number; totalHari: number
}
type RekapPayroll = {
  karyawanId: number; nama: string; nik: string
  totalGaji: number; totalTunjangan: number; totalPotongan: number; totalBersih: number; bulan: number; tahun: number
}
type RekapBpjs = {
  karyawanId: number; nama: string; nik: string
  bpjsKsEmployee: number; bpjsKsEmployer: number; bpjsTkEmployee: number; bpjsTkEmployer: number; total: number
}
type RekapPPh = {
  karyawanId: number; nama: string; nik: string; npwp: string | null
  penghasilanKotor: number; ptkp: number; pkp: number; pph21Tahunan: number; pph21Bulanan: number
}

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]

// ─── Icons ───
const IconReport = ({ c="w-5 h-5" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const IconDownload = ({ c="w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const IconRefresh = ({ c="w-3.5 h-3.5" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
const IconFilter = ({ c="w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>

const fmt = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)

function downloadCSV(data: unknown[], filename: string) {
  if (data.length === 0) return
  const keys = Object.keys(data[0] as Record<string, unknown>)
  const csv = [
    keys.join(","),
    ...data.map(row => keys.map(k => `"${String((row as Record<string, unknown>)[k] ?? "")}"`).join(","))
  ].join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ─── Report Card Component ───
function ReportCard({ title, icon, active, onClick, children }: {
  title: string; icon: React.ReactNode; active: boolean; onClick: () => void; children: React.ReactNode
}) {
  return (
    <div className={`rounded-xl border transition-all ${active ? "border-indigo-500/40 bg-indigo-500/5" : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"}`}>
      <button onClick={onClick} className="w-full flex items-center gap-3 px-5 py-4 text-left">
        <div className={`rounded-lg p-2 ${active ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-400"}`}>{icon}</div>
        <span className={`text-sm font-medium ${active ? "text-indigo-200" : "text-zinc-300"}`}>{title}</span>
      </button>
      {active && <div className="px-5 pb-5">{children}</div>}
    </div>
  )
}

// ─── Absensi Report ───
function AbsensiReport({ tahun }: { tahun: string }) {
  const [data, setData]   = useState<RekapAbsensi[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/laporan/absensi?tahun=${tahun}`)
      if (res.ok) setData(await res.json())
    } catch (_) {}
    setLoading(false)
  }, [tahun])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Rekap absensi karyawan tahun {tahun}</p>
        <button onClick={() => downloadCSV(data as unknown as unknown[] as never, `rekap-absensi-${tahun}.csv`)}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition">
          <IconDownload /> Export CSV
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-zinc-500 italic">Memuat...</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-zinc-500 italic">Tidak ada data.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                <th className="py-3 pr-4 font-medium">Nama</th>
                <th className="py-3 px-3 font-medium text-center">NIK</th>
                <th className="py-3 px-3 font-medium text-center">Hadir</th>
                <th className="py-3 px-3 font-medium text-center">Izin</th>
                <th className="py-3 px-3 font-medium text-center">Sakit</th>
                <th className="py-3 px-3 font-medium text-center">Cuti</th>
                <th className="py-3 px-3 font-medium text-center text-rose-400">Alpha</th>
                <th className="py-3 pl-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.karyawanId} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
                  <td className="py-2.5 pr-4 font-medium text-zinc-200">{d.nama}</td>
                  <td className="py-2.5 px-3 text-zinc-400 font-mono">{d.nik}</td>
                  <td className="py-2.5 px-3 text-center text-emerald-400 font-mono">{d.totalHadir}</td>
                  <td className="py-2.5 px-3 text-center text-blue-400 font-mono">{d.totalIzin}</td>
                  <td className="py-2.5 px-3 text-center text-amber-400 font-mono">{d.totalSakit}</td>
                  <td className="py-2.5 px-3 text-center text-purple-400 font-mono">{d.totalCuti}</td>
                  <td className="py-2.5 px-3 text-center text-rose-400 font-mono">{d.totalAlpha}</td>
                  <td className="py-2.5 pl-3 text-right font-mono text-zinc-300">{d.totalHari}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Payroll Report ───
function PayrollReport({ tahun }: { tahun: string }) {
  const [data, setData]     = useState<RekapPayroll[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/laporan/payroll?tahun=${tahun}`)
      if (res.ok) setData(await res.json())
    } catch (_) {}
    setLoading(false)
  }, [tahun])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Rekap payroll karyawan tahun {tahun}</p>
        <button onClick={() => downloadCSV(data as unknown as unknown[] as never, `rekap-payroll-${tahun}.csv`)}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition">
          <IconDownload /> Export CSV
        </button>
      </div>
      {loading ? <p className="text-sm text-zinc-500 italic">Memuat...</p>
       : data.length === 0 ? <p className="text-sm text-zinc-500 italic">Tidak ada data.</p>
       : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                <th className="py-3 pr-4 font-medium">Nama</th>
                <th className="py-3 px-3 font-medium text-center">NIK</th>
                <th className="py-3 px-3 font-medium text-right">Gaji</th>
                <th className="py-3 px-3 font-medium text-right">Tunjangan</th>
                <th className="py-3 px-3 font-medium text-right">Potongan</th>
                <th className="py-3 pl-3 font-medium text-right text-emerald-400">Bersih</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.karyawanId} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
                  <td className="py-2.5 pr-4 font-medium text-zinc-200">{d.nama}</td>
                  <td className="py-2.5 px-3 text-zinc-400 font-mono">{d.nik}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-200">{fmt(d.totalGaji)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-sky-300">{fmt(d.totalTunjangan)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-300">{fmt(d.totalPotongan)}</td>
                  <td className="py-2.5 pl-3 text-right font-mono text-emerald-300 font-semibold">{fmt(d.totalBersih)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── BPJS Report ───
function BpjsReport({ tahun }: { tahun: string }) {
  const [data, setData]     = useState<RekapBpjs[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/laporan/bpjs?tahun=${tahun}`)
      if (res.ok) setData(await res.json())
    } catch (_) {}
    setLoading(false)
  }, [tahun])

  useEffect(() => { fetchData() }, [fetchData])

  const totalKsEmp  = data.reduce((s, d) => s + d.bpjsKsEmployee, 0)
  const totalKsEmpr = data.reduce((s, d) => s + d.bpjsKsEmployer, 0)
  const totalTkEmp  = data.reduce((s, d) => s + d.bpjsTkEmployee, 0)
  const totalTkEmpr = data.reduce((s, d) => s + d.bpjsTkEmployer, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Kontribusi BPJS Kesehatan & Ketenagakerjaan tahun {tahun}</p>
        <button onClick={() => downloadCSV(data as unknown as unknown[] as never, `rekap-bpjs-${tahun}.csv`)}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition">
          <IconDownload /> Export CSV
        </button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-center">
          <p className="text-xs text-zinc-500">KS Karyawan/thn</p>
          <p className="text-sm font-bold font-mono text-sky-300">{fmt(totalKsEmp)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-center">
          <p className="text-xs text-zinc-500">KS Perusahaan/thn</p>
          <p className="text-sm font-bold font-mono text-sky-400">{fmt(totalKsEmpr)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-center">
          <p className="text-xs text-zinc-500">TK Karyawan/thn</p>
          <p className="text-sm font-bold font-mono text-emerald-300">{fmt(totalTkEmp)}</p>
        </div>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-center">
          <p className="text-xs text-zinc-500">TK Perusahaan/thn</p>
          <p className="text-sm font-bold font-mono text-emerald-400">{fmt(totalTkEmpr)}</p>
        </div>
      </div>
      {loading ? <p className="text-sm text-zinc-500 italic">Memuat...</p>
       : data.length === 0 ? <p className="text-sm text-zinc-500 italic">Tidak ada data.</p>
       : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                <th className="py-3 pr-4 font-medium">Nama</th>
                <th className="py-3 px-3 font-medium text-center">NIK</th>
                <th className="py-3 px-3 font-medium text-right">KS Emp</th>
                <th className="py-3 px-3 font-medium text-right">KS Empr</th>
                <th className="py-3 px-3 font-medium text-right">TK Emp</th>
                <th className="py-3 pl-3 font-medium text-right">TK Empr</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.karyawanId} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
                  <td className="py-2.5 pr-4 font-medium text-zinc-200">{d.nama}</td>
                  <td className="py-2.5 px-3 text-zinc-400 font-mono">{d.nik}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-200">{fmt(d.bpjsKsEmployee)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-sky-400">{fmt(d.bpjsKsEmployer)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-200">{fmt(d.bpjsTkEmployee)}</td>
                  <td className="py-2.5 pl-3 text-right font-mono text-emerald-400">{fmt(d.bpjsTkEmployer)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── PPh 21 Report ───
function PPhReport({ tahun }: { tahun: string }) {
  const [data, setData]     = useState<RekapPPh[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/laporan/pph21?tahun=${tahun}`)
      if (res.ok) setData(await res.json())
    } catch (_) {}
    setLoading(false)
  }, [tahun])

  useEffect(() => { fetchData() }, [fetchData])

  const totalPPh = data.reduce((s, d) => s + d.pph21Tahunan, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-500">Laporan PPh 21 karyawan tahun {tahun}</p>
        <button onClick={() => downloadCSV(data as unknown as unknown[] as never, `rekap-pph21-${tahun}.csv`)}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition">
          <IconDownload /> Export CSV
        </button>
      </div>
      {totalPPh > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-center">
          <p className="text-xs text-zinc-500 mb-1">Total PPh 21 Terutang per Tahun</p>
          <p className="text-2xl font-bold font-mono text-amber-400">{fmt(totalPPh)}</p>
        </div>
      )}
      {loading ? <p className="text-sm text-zinc-500 italic">Memuat...</p>
       : data.length === 0 ? <p className="text-sm text-zinc-500 italic">Tidak ada data payroll untuk perhitungan pajak.</p>
       : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider">
                <th className="py-3 pr-4 font-medium">Nama</th>
                <th className="py-3 px-3 font-medium text-center">NIK</th>
                <th className="py-3 px-3 font-medium text-right">Penghasilan Kotor</th>
                <th className="py-3 px-3 font-medium text-right">PTKP</th>
                <th className="py-3 px-3 font-medium text-right">PKP</th>
                <th className="py-3 pl-3 font-medium text-right text-amber-400">PPh 21/thn</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.karyawanId} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
                  <td className="py-2.5 pr-4 font-medium text-zinc-200">{d.nama}</td>
                  <td className="py-2.5 px-3 text-zinc-400 font-mono">{d.nik}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-200">{fmt(d.penghasilanKotor)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-400">{fmt(d.ptkp)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-300">{fmt(d.pkp)}</td>
                  <td className="py-2.5 pl-3 text-right font-mono text-amber-300 font-semibold">{fmt(d.pph21Tahunan)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Main ───
export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState<ReportType>("absensi")
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))

  const tabs: { id: ReportType; label: string; icon: React.ReactNode }[] = [
    { id: "absensi",  label: "Rekap Absensi", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { id: "payroll",  label: "Rekap Payroll", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
    { id: "bpjs",     label: "Laporan BPJS", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: "pph21",    label: "PPh 21",        icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  ]

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-indigo-500/15 p-2.5 ring-1 ring-indigo-500/20">
          <IconReport c="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Laporan HRD komprehensif</p>
        </div>
      </div>

      {/* Year Filter */}
      <div className="flex items-center gap-3">
        <IconFilter c="w-4 h-4 text-zinc-500" />
        <select value={tahun} onChange={e => setTahun(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none">
          {[new Date().getFullYear() - 2, new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id ? "bg-indigo-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
        {activeTab === "absensi"  && <AbsensiReport tahun={tahun} />}
        {activeTab === "payroll"  && <PayrollReport tahun={tahun} />}
        {activeTab === "bpjs"     && <BpjsReport tahun={tahun} />}
        {activeTab === "pph21"   && <PPhReport tahun={tahun} />}
      </div>
    </div>
  )
}
