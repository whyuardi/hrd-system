import { prisma } from "@/lib/prisma"
import Link from "next/link"

// ─── Helpers ───
const currency = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)

const statusBadge: Record<string, string> = {
  aktif: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  nonaktif: "bg-zinc-500/15 text-zinc-300 ring-zinc-500/30",
  resign: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
}

// ─── SVG Icons ───
function SearchIcon() {
  return (
    <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  )
}

// ─── Types ───
type SearchParams = Promise<{ q?: string }>

// ─── Page ───
export default async function KaryawanListPage({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams

  const karyawanList = await prisma.karyawan.findMany({
    where: q
      ? {
          OR: [
            { nama: { contains: q } },
            { nik: { contains: q } },
          ],
        }
      : undefined,
    include: {
      departemen: { select: { nama: true } },
      jabatan: { select: { nama: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const totalCount = karyawanList.length

  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8 space-y-6">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
          Dashboard
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-300 font-medium">Karyawan</span>
      </nav>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-indigo-500/15 p-2.5 ring-1 ring-indigo-500/20">
            <UsersIcon />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Karyawan</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {totalCount} karyawan terdaftar
            </p>
          </div>
        </div>
        <Link
          href="/karyawan/baru"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
        >
          <PlusIcon />
          Tambah Karyawan
        </Link>
      </div>

      {/* ── Search ── */}
      <form method="GET" className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Cari nama atau NIK..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/60 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded-xl transition-colors"
        >
          Cari
        </button>
        {q && (
          <Link
            href="/karyawan"
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-sm rounded-xl transition-colors border border-zinc-800"
          >
            Reset
          </Link>
        )}
      </form>

      {/* ── Table ── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                <th className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Nama</th>
                <th className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">NIK</th>
                <th className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Departemen</th>
                <th className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Jabatan</th>
                <th className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-zinc-500">Status</th>
                <th className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-zinc-500 text-right">Gaji Pokok</th>
                <th className="py-3.5 px-4 font-semibold text-xs uppercase tracking-wider text-zinc-500 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {karyawanList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-zinc-500 italic">
                    {q ? `Tidak ada karyawan dengan kata kunci "${q}".` : "Belum ada data karyawan."}
                  </td>
                </tr>
              ) : (
                karyawanList.map((k) => (
                  <tr
                    key={k.id}
                    className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <Link href={`/karyawan/${k.id}`} className="font-medium text-zinc-200 hover:text-indigo-400 transition-colors">
                        {k.nama}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-xs">{k.nik}</td>
                    <td className="py-3.5 px-4 text-zinc-300">{k.departemen?.nama ?? "—"}</td>
                    <td className="py-3.5 px-4 text-zinc-300">{k.jabatan?.nama ?? "—"}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${
                          statusBadge[k.status] ?? "bg-zinc-700 text-zinc-300 ring-zinc-600"
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-sm text-zinc-200">
                      {currency(k.gajiPokok)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/karyawan/${k.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
                          title="Lihat detail"
                        >
                          <EyeIcon />
                        </Link>
                        <Link
                          href={`/karyawan/${k.id}?edit=1`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-100 transition-colors"
                          title="Edit"
                        >
                          <EditIcon />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Footer summary */}
        {karyawanList.length > 0 && (
          <div className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500 flex items-center justify-between">
            <span>Menampilkan {karyawanList.length} karyawan</span>
            <span className="text-zinc-600">
              Aktif: {karyawanList.filter((k) => k.status === "aktif").length}
              {" · "}Nonaktif: {karyawanList.filter((k) => k.status === "nonaktif").length}
              {" · "}Resign: {karyawanList.filter((k) => k.status === "resign").length}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
