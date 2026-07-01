"use client"

import { useState, useEffect, useCallback } from "react"

// ─── Types ───
type DepartemenWithCount = {
  id: number
  nama: string
  deskripsi: string | null
  _count: { jabatan: number; karyawan: number }
}

// ─── Inline SVG Icons ───
const IconPlus = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)
const IconEdit = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)
const IconTrash = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)
const IconX = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)
const IconBuilding = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" /><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
    <path d="M9 7h2" /><path d="M9 11h2" /><path d="M9 15h2" />
    <path d="M13 7h2" /><path d="M13 11h2" /><path d="M13 15h2" />
  </svg>
)

// ─── Main Page ───
export default function DepartemenPage() {
  const [data, setData] = useState<DepartemenWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DepartemenWithCount | null>(null)
  const [formNama, setFormNama] = useState("")
  const [formDeskripsi, setFormDeskripsi] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  // Delete confirmation
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState("")

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/departemen")
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal memuat data")
      }
      const json = await res.json()
      setData(json)
      setError("")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Open modal for add ──
  const openAdd = () => {
    setEditing(null)
    setFormNama("")
    setFormDeskripsi("")
    setFormError("")
    setModalOpen(true)
  }

  // ── Open modal for edit ──
  const openEdit = (item: DepartemenWithCount) => {
    setEditing(item)
    setFormNama(item.nama)
    setFormDeskripsi(item.deskripsi ?? "")
    setFormError("")
    setModalOpen(true)
  }

  // ── Close modal ──
  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
    setFormError("")
  }

  // ── Save (create or update) ──
  const handleSave = async () => {
    const trimmedNama = formNama.trim()
    if (!trimmedNama) {
      setFormError("Nama departemen harus diisi")
      return
    }
    setSaving(true)
    setFormError("")

    try {
      const body = { nama: trimmedNama, deskripsi: formDeskripsi.trim() || null }

      let res: Response
      if (editing) {
        res = await fetch(`/api/departemen/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch("/api/departemen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menyimpan")
      }

      closeModal()
      await fetchData()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Terjadi kesalahan")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ──
  const handleDelete = async (id: number) => {
    setDeleteError("")
    setDeleting(id)
    try {
      const res = await fetch(`/api/departemen/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menghapus")
      }
      setDeleting(null)
      await fetchData()
    } catch (e: unknown) {
      setDeleteError(e instanceof Error ? e.message : "Terjadi kesalahan")
      setDeleting(null)
    }
  }

  // ── Render ──
  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <IconBuilding className="w-7 h-7 text-indigo-400" />
            Departemen
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Kelola data departemen perusahaan</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <IconPlus className="w-4 h-4" />
          Tambah Departemen
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {deleteError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {deleteError}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <th className="py-4 pl-5 pr-4 font-medium">Nama</th>
                <th className="py-4 px-4 font-medium">Deskripsi</th>
                <th className="py-4 px-4 font-medium text-center">Jumlah Jabatan</th>
                <th className="py-4 px-4 font-medium text-center">Jumlah Karyawan</th>
                <th className="py-4 pl-4 pr-5 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-zinc-500 italic">
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-zinc-500 italic">
                    Belum ada departemen. Klik &quot;Tambah Departemen&quot; untuk menambahkan.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                    <td className="py-4 pl-5 pr-4">
                      <span className="font-medium text-zinc-200">{item.nama}</span>
                    </td>
                    <td className="py-4 px-4 text-zinc-400 max-w-xs truncate">
                      {item.deskripsi || <span className="italic text-zinc-600">—</span>}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold text-sky-400 ring-1 ring-inset ring-sky-500/30">
                        {item._count.jabatan}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 ring-1 ring-inset ring-emerald-500/30">
                        {item._count.karyawan}
                      </span>
                    </td>
                    <td className="py-4 pl-4 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
                        >
                          <IconEdit />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-rose-400 transition hover:bg-rose-500/15 hover:text-rose-300 disabled:opacity-50"
                        >
                          <IconTrash />
                          {deleting === item.id ? "..." : "Hapus"}
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

      {/* ── Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal panel */}
          <div className="relative w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <h2 className="text-base font-semibold text-zinc-100">
                {editing ? "Edit Departemen" : "Tambah Departemen"}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {formError && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="nama" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Nama Departemen <span className="text-rose-400">*</span>
                </label>
                <input
                  id="nama"
                  type="text"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  placeholder="Masukkan nama departemen"
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="deskripsi" className="block text-sm font-medium text-zinc-300 mb-1.5">
                  Deskripsi
                </label>
                <textarea
                  id="deskripsi"
                  value={formDeskripsi}
                  onChange={(e) => setFormDeskripsi(e.target.value)}
                  placeholder="Deskripsi departemen (opsional)"
                  rows={3}
                  className="block w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-800 px-6 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
