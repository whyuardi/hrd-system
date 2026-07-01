"use client"

import { useEffect, useState, useCallback } from "react"

// ─── Types ───
type Departemen = {
  id: number
  nama: string
}

type Jabatan = {
  id: number
  nama: string
  departemenId: number
  departemen: { id: number; nama: string }
  _count?: { karyawan: number }
  createdAt: string
}

type FormData = {
  nama: string
  departemenId: string
}

// ─── Icons ───
const IconPlus = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

const IconEdit = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)

const IconX = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
  </svg>
)

// ─── Format date ───
const formatDate = (d: string) => {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(d))
  } catch {
    return d
  }
}

// ─── Toast helper ───
function Toast({
  message,
  type,
  onClose,
}: {
  message: string
  type: "success" | "error"
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={`fixed top-5 right-5 z-50 flex items-center gap-3 rounded-lg px-5 py-3 text-sm font-medium shadow-lg transition-all ${
        type === "success"
          ? "bg-emerald-600 text-white"
          : "bg-rose-600 text-white"
      }`}
    >
      <span>{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <IconX />
      </button>
    </div>
  )
}

// ─── Confirm Dialog ───
function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
        <p className="mt-2 text-sm text-zinc-400">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:opacity-50"
          >
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Form ───
function JabatanModal({
  open,
  onClose,
  onSubmit,
  initialData,
  departemenList,
  loading,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => void
  initialData?: Jabatan | null
  departemenList: Departemen[]
  loading: boolean
}) {
  const [form, setForm] = useState<FormData>({ nama: "", departemenId: "" })
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({ nama: initialData.nama, departemenId: String(initialData.departemenId) })
      } else {
        setForm({ nama: "", departemenId: departemenList.length > 0 ? String(departemenList[0].id) : "" })
      }
      setError("")
    }
  }, [open, initialData, departemenList])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nama.trim()) {
      setError("Nama jabatan harus diisi")
      return
    }
    if (!form.departemenId) {
      setError("Departemen harus dipilih")
      return
    }
    setError("")
    onSubmit(form)
  }

  if (!open) return null

  const isEdit = !!initialData

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-zinc-100">
            {isEdit ? "Edit Jabatan" : "Tambah Jabatan"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300"
          >
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nama */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Nama Jabatan
            </label>
            <input
              type="text"
              value={form.nama}
              onChange={(e) => setForm({ ...form, nama: e.target.value })}
              placeholder="Masukkan nama jabatan"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Departemen */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              Departemen
            </label>
            <select
              value={form.departemenId}
              onChange={(e) => setForm({ ...form, departemenId: e.target.value })}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Pilih departemen
              </option>
              {departemenList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nama}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Jabatan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ───
export default function JabatanPage() {
  const [jabatanList, setJabatanList] = useState<Jabatan[]>([])
  const [departemenList, setDepartemenList] = useState<Departemen[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [filterDepartemen, setFilterDepartemen] = useState("")
  const [search, setSearch] = useState("")

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingJabatan, setEditingJabatan] = useState<Jabatan | null>(null)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Jabatan | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  // ── Fetch data ──
  const fetchJabatan = useCallback(async (depId?: string) => {
    try {
      const params = depId ? `?departemenId=${depId}` : ""
      const res = await fetch(`/api/jabatan${params}`)
      if (!res.ok) throw new Error("Gagal mengambil data")
      const data = await res.json()
      setJabatanList(data)
    } catch {
      setToast({ message: "Gagal memuat data jabatan", type: "error" })
    }
  }, [])

  const fetchDepartemen = useCallback(async () => {
    try {
      const res = await fetch("/api/departemen")
      if (!res.ok) throw new Error("Gagal mengambil data")
      const data = await res.json()
      setDepartemenList(data)
    } catch {
      setToast({ message: "Gagal memuat data departemen", type: "error" })
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([fetchJabatan(), fetchDepartemen()])
      setLoading(false)
    }
    init()
  }, [fetchJabatan, fetchDepartemen])

  // ── Filter: when departemen filter changes ──
  useEffect(() => {
    fetchJabatan(filterDepartemen || undefined)
  }, [filterDepartemen, fetchJabatan])

  // ── CRUD Handlers ──
  const handleCreate = async (data: FormData) => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/jabatan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: data.nama.trim(), departemenId: Number(data.departemenId) }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal membuat jabatan")
      }
      setToast({ message: "Jabatan berhasil ditambahkan", type: "success" })
      setModalOpen(false)
      setEditingJabatan(null)
      fetchJabatan(filterDepartemen || undefined)
    } catch (err: any) {
      setToast({ message: err.message || "Gagal membuat jabatan", type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (data: FormData) => {
    if (!editingJabatan) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/jabatan/${editingJabatan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: data.nama.trim(), departemenId: Number(data.departemenId) }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal memperbarui jabatan")
      }
      setToast({ message: "Jabatan berhasil diperbarui", type: "success" })
      setModalOpen(false)
      setEditingJabatan(null)
      fetchJabatan(filterDepartemen || undefined)
    } catch (err: any) {
      setToast({ message: err.message || "Gagal memperbarui jabatan", type: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/jabatan/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menghapus jabatan")
      }
      setToast({ message: "Jabatan berhasil dihapus", type: "success" })
      setDeleteTarget(null)
      fetchJabatan(filterDepartemen || undefined)
    } catch (err: any) {
      setToast({ message: err.message || "Gagal menghapus jabatan", type: "error" })
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  // ── Modal open handlers ──
  const openAddModal = () => {
    setEditingJabatan(null)
    setModalOpen(true)
  }

  const openEditModal = (jabatan: Jabatan) => {
    setEditingJabatan(jabatan)
    setModalOpen(true)
  }

  // ── Filtered & searched data ──
  const filteredList = jabatanList.filter((j) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      j.nama.toLowerCase().includes(q) ||
      j.departemen.nama.toLowerCase().includes(q)
    )
  })

  // ── Render ──
  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8 space-y-6">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Jabatan"
        message={`Apakah Anda yakin ingin menghapus jabatan "${deleteTarget?.nama}"? ${
          (deleteTarget?._count?.karyawan ?? 0) > 0
            ? `Masih ada ${deleteTarget?._count?.karyawan} karyawan yang menggunakan jabatan ini.`
            : ""
        }`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      {/* Modal Form */}
      <JabatanModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingJabatan(null)
        }}
        onSubmit={editingJabatan ? handleUpdate : handleCreate}
        initialData={editingJabatan}
        departemenList={departemenList}
        loading={submitting}
      />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jabatan</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Kelola data jabatan dalam organisasi
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          <IconPlus />
          Tambah Jabatan
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-zinc-500">
              <IconSearch />
            </span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari jabatan..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Departemen filter */}
        <select
          value={filterDepartemen}
          onChange={(e) => setFilterDepartemen(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-zinc-100 transition focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Semua Departemen</option>
          {departemenList.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nama}
            </option>
          ))}
        </select>
      </div>

      {/* ── Table ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <th className="py-3.5 px-4 font-medium">No</th>
                <th className="py-3.5 px-4 font-medium">Nama Jabatan</th>
                <th className="py-3.5 px-4 font-medium">Departemen</th>
                <th className="py-3.5 px-4 font-medium">Jumlah Karyawan</th>
                <th className="py-3.5 px-4 font-medium">Dibuat</th>
                <th className="py-3.5 px-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-zinc-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-indigo-500" />
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-zinc-500 italic">
                    {jabatanList.length === 0
                      ? "Belum ada data jabatan."
                      : "Tidak ada jabatan yang sesuai dengan filter."}
                  </td>
                </tr>
              ) : (
                filteredList.map((j, idx) => (
                  <tr
                    key={j.id}
                    className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-zinc-500">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-medium text-zinc-200">{j.nama}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/20">
                        {j.departemen.nama}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">{j._count?.karyawan ?? 0}</td>
                    <td className="py-3.5 px-4 text-zinc-400 text-xs">{formatDate(j.createdAt)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(j)}
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-sky-400"
                          title="Edit jabatan"
                        >
                          <IconEdit />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(j)}
                          className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-rose-400"
                          title="Hapus jabatan"
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Table footer with count */}
        {!loading && filteredList.length > 0 && (
          <div className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500">
            Menampilkan {filteredList.length} dari {jabatanList.length} jabatan
            {filterDepartemen ? " (terfilter)" : ""}
          </div>
        )}
      </div>
    </div>
  )
}
