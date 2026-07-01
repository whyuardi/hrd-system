"use client"

import { useState, useEffect, useCallback } from "react"

type Setting = { key: string; value: string; label: string | null }

type PayrollConfig = {
  bpjsKsRate: number; bpjsKsMax: number; bpjsTkRate: number
  ptkp: Record<string, number>
}

// ─── Icons ───
const IconGear  = ({ c="w-5 h-5" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
const IconSave  = ({ c="w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const IconCheck = ({ c="w-4 h-4" }) => <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
      <div className="border-b border-zinc-800 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}

const Input = ({ label, id, type = "text", value, onChange, placeholder, suffix }: {
  label: string; id: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; suffix?: string
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
    <div className="relative">
      <input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">{suffix}</span>}
    </div>
  </div>
)

// ─── Company Settings ───
function CompanySection({ onData }: { onData: (data: Setting[]) => void }) {
  const [settings, setSettings] = useState<Setting[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState("")

  const FIELDS = [
    { key: "company_name",    label: "Nama Perusahaan",   placeholder: "PT. Contoh Indonesia" },
    { key: "company_address", label: "Alamat",             placeholder: "Jl. Contoh No. 1, Jakarta" },
    { key: "company_phone",   label: "Telepon",            placeholder: "021-1234567" },
    { key: "company_email",   label: "Email",              placeholder: "info@contoh.com" },
    { key: "company_npwp",    label: "NPWP Perusahaan",    placeholder: "01.234.567.8-901.000" },
  ]

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
        onData(data)
      }
    } catch (_) {}
  }, [onData])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
  }

  const getVal = (key: string) => settings.find(s => s.key === key)?.value ?? ""

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      })
      if (!res.ok) throw new Error("Gagal menyimpan")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title="Informasi Perusahaan">
      <div className="space-y-4">
        {FIELDS.map(({ key, label, placeholder }) => (
          <Input key={key} id={key} label={label} value={getVal(key)} onChange={v => updateSetting(key, v)} placeholder={placeholder} />
        ))}
        {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            {saved ? <><IconCheck /> Tersimpan</> : <><IconSave /> {saving ? "Menyimpan..." : "Simpan Perubahan"}</>}
          </button>
        </div>
      </div>
    </Section>
  )
}

// ─── Payroll Config ───
function PayrollConfigSection() {
  const [config, setConfig]     = useState<PayrollConfig>({ bpjsKsRate: 1, bpjsKsMax: 120000, bpjsTkRate: 2, ptkp: {} })
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState("")

  const BpjsRateInput = ({ label, id, suffix }: { label: string; id: keyof PayrollConfig; suffix: string }) => (
    <div>
      <label className="block text-sm font-medium text-zinc-300 mb-1.5">{label}</label>
      <div className="relative">
        <input type="number" step="0.1" value={String(config[id])} onChange={e => setConfig(p => ({ ...p, [id]: Number(e.target.value) }))}
          className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 pr-12 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">{suffix}</span>
      </div>
    </div>
  )

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: [
          { key: "bpjs_ks_rate",    value: String(config.bpjsKsRate) },
          { key: "bpjs_ks_max",     value: String(config.bpjsKsMax) },
          { key: "bpjs_tk_rate",    value: String(config.bpjsTkRate) },
        ]}),
      })
      if (!res.ok) throw new Error("Gagal menyimpan")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  const PTKP_TABLE: [string, string, number][] = [
    ["TK/0", "Tidak Kawin tanpa Tanggungan", 54000000],
    ["K/0",   "Kawin tanpa Tanggungan",       58500000],
    ["K/1",   "Kawin dengan 1 Tanggungan",    63000000],
    ["K/2",   "Kawin dengan 2 Tanggungan",    67500000],
    ["K/3",   "Kawin dengan 3 Tanggungan",    72000000],
  ]

  return (
    <Section title="Konfigurasi Payroll & BPJS">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-3">BPJS Kesehatan</h3>
          <div className="grid grid-cols-2 gap-4">
            <BpjsRateInput label="Iuran Karyawan" id="bpjsKsRate" suffix="%" />
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">Maksimum Iuran</label>
              <div className="relative">
                <input type="number" value={String(config.bpjsKsMax)} onChange={e => setConfig(p => ({ ...p, bpjsKsMax: Number(e.target.value) }))}
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 pr-14 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">/bulan</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-3">BPJS Ketenagakerjaan</h3>
          <div className="grid grid-cols-2 gap-4">
            <BpjsRateInput label="Iuran JHT Karyawan" id="bpjsTkRate" suffix="%" />
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-500">
              <span className="text-zinc-400 font-medium">Iuran JKK + JKM Perusahaan:</span> 0.24% + 0.30%
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-3">PTKP 2024 (PPh 21)</h3>
          <div className="rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4 font-medium text-left">Kode</th>
                  <th className="py-2.5 px-4 font-medium text-left">Deskripsi</th>
                  <th className="py-2.5 px-4 font-medium text-right">PTKP/Tahun</th>
                </tr>
              </thead>
              <tbody>
                {PTKP_TABLE.map(([kode, desc, nilai]) => (
                  <tr key={kode} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
                    <td className="py-2 px-4 font-mono text-zinc-200">{kode}</td>
                    <td className="py-2 px-4 text-zinc-400">{desc}</td>
                    <td className="py-2 px-4 text-right font-mono text-emerald-400">Rp {(nilai/1000000).toFixed(1)}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}
        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            {saved ? <><IconCheck /> Tersimpan</> : <><IconSave /> {saving ? "Menyimpan..." : "Simpan Konfigurasi"}</>}
          </button>
        </div>
      </div>
    </Section>
  )
}

// ─── System Info ───
function SystemSection() {
  return (
    <Section title="Informasi Sistem">
      <div className="space-y-3 text-sm">
        {[
          ["Versi", "1.0.0"],
          ["Database", "SQLite via Prisma ORM"],
          ["Framework", "Next.js 14 + TypeScript"],
          ["Auth", "NextAuth.js (Credentials)"],
          ["Akses", "Role-based (Admin, HRD, Manager, Karyawan)"],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between border-b border-zinc-800/50 pb-2.5 last:border-0 last:pb-0">
            <span className="text-zinc-400">{label}</span>
            <span className="text-zinc-200 font-medium">{value}</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

// ─── Main ───
export default function SettingsPage() {
  const handleData = useCallback((_data: Setting[]) => {}, [])

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-indigo-500/15 p-2.5 ring-1 ring-indigo-500/20">
          <IconGear c="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Konfigurasi sistem & perusahaan</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-3xl">
        <CompanySection onData={handleData} />
        <PayrollConfigSection />
        <SystemSection />
      </div>
    </div>
  )
}
