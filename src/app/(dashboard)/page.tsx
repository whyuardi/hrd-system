import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// ─── Icons (inline SVG) ───
const icons = {
  users: (
    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  check: (
    <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  wallet: (
    <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-1M3 7a2 2 0 012-2h12l2 2M3 7a2 2 0 012-2h12l2 2" />
    </svg>
  ),
  arrowUp: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  arrowDown: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ),
}

// ─── Types ───
type CardData = {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  trend: "up" | "down" | "neutral"
  trendLabel: string
}

type AbsensiRow = {
  id: number
  karyawan: string | null
  tanggal: string
  status: string
  checkIn: string | null
  checkOut: string | null
}

// ─── Format helper ───
const currency = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)

const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(d)

const formatTime = (d: Date | null) => {
  if (!d) return "—"
  return new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(d)
}

// ─── Badge colors for status ───
const badge: Record<string, string> = {
  hadir: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  izin: "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  sakit: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  cuti: "bg-violet-500/15 text-violet-300 ring-violet-500/30",
  alpha: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
}

// ─── Main Page ───
export default async function DashboardPage() {
  const session = await auth()

  // ── Parallel data fetching ──
  const [
    totalKaryawan,
    aktifCount,
    cutiPending,
    payrollBulanIni,
    recentAbsensi,
    chartData,
  ] = await Promise.all([
    prisma.karyawan.count(),
    prisma.karyawan.count({ where: { status: "aktif" } }),
    prisma.cuti.count({ where: { status: "menunggu" } }),
    prisma.payroll.aggregate({
      where: {
        periodeBulan: new Date().getMonth() + 1,
        periodeTahun: new Date().getFullYear(),
        status: { not: "draft" },
      },
      _sum: { gajiBersih: true },
      _count: true,
    }),
    prisma.absensi.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        karyawan: { select: { nama: true } },
      },
    }),
    // Chart: absensi grouped by status for current month
    prisma.absensi.groupBy({
      by: ["status"],
      where: {
        tanggal: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
      },
      _count: { id: true },
    }),
  ])

  // ── Build cards ──
  const cards: CardData[] = [
    {
      label: "Total Karyawan",
      value: totalKaryawan,
      sub: "Semua karyawan terdaftar",
      icon: icons.users,
      trend: "up",
      trendLabel: `${aktifCount} aktif`,
    },
    {
      label: "Karyawan Aktif",
      value: aktifCount,
      sub: `${((aktifCount / (totalKaryawan || 1)) * 100).toFixed(0)}% dari total`,
      icon: icons.check,
      trend: "neutral",
      trendLabel: `${totalKaryawan - aktifCount} non-aktif`,
    },
    {
      label: "Cuti Pending",
      value: cutiPending,
      sub: "Menunggu persetujuan",
      icon: icons.clock,
      trend: cutiPending > 0 ? "up" : "neutral",
      trendLabel: cutiPending > 0 ? "Perlu ditindak" : "Tidak ada",
    },
    {
      label: "Payroll Bulan Ini",
      value: currency(payrollBulanIni._sum.gajiBersih ?? 0),
      sub: `${payrollBulanIni._count} karyawan dibayar`,
      icon: icons.wallet,
      trend: "neutral",
      trendLabel: "Periode " + new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date()),
    },
  ]

  // ── Build recent absensi rows ──
  const rows: AbsensiRow[] = recentAbsensi.map((a) => ({
    id: a.id,
    karyawan: a.karyawan?.nama ?? "—",
    tanggal: formatDate(a.tanggal),
    status: a.status,
    checkIn: formatTime(a.checkIn),
    checkOut: formatTime(a.checkOut),
  }))

  // ── Build chart data ──
  const statusLabels: Record<string, string> = {
    hadir: "Hadir",
    izin: "Izin",
    sakit: "Sakit",
    cuti: "Cuti",
    alpha: "Alpha",
  }
  const statusColors: Record<string, string> = {
    hadir: "bg-emerald-500",
    izin: "bg-sky-500",
    sakit: "bg-amber-500",
    cuti: "bg-violet-500",
    alpha: "bg-rose-500",
  }
  const totalChart = chartData.reduce((acc, c) => acc + c._count.id, 0) || 1

  // ── Quick actions ──
  const quickActions = [
    { label: "Tambah Karyawan", href: "#", desc: "Data karyawan baru", color: "bg-emerald-600 hover:bg-emerald-500" },
    { label: "Rekap Absensi", href: "#", desc: "Lihat presensi hari ini", color: "bg-sky-600 hover:bg-sky-500" },
    { label: "Proses Cuti", href: "#", desc: `${cutiPending} pengajuan pending`, color: "bg-amber-600 hover:bg-amber-500" },
    { label: "Buat Payroll", href: "#", desc: "Generate payroll bulan ini", color: "bg-violet-600 hover:bg-violet-500" },
  ]

  // ── Render ──
  return (
    <div className="flex-1 min-h-screen bg-zinc-950 text-zinc-100 p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Selamat datang{session?.user?.name ? `, ${session.user.name}` : ""} 👋
          </p>
        </div>
        <div className="text-xs text-zinc-500 text-right leading-relaxed">
          <div>{new Intl.DateTimeFormat("id-ID", { dateStyle: "full" }).format(new Date())}</div>
          <div className="font-mono text-zinc-600">{new Intl.DateTimeFormat("id-ID", { timeStyle: "short" }).format(new Date())} WIB</div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 transition hover:border-zinc-700"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{card.label}</p>
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                <p className="text-xs text-zinc-500">{card.sub}</p>
              </div>
              <div className="rounded-lg bg-zinc-800/60 p-2.5">{card.icon}</div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              {card.trend === "up" && <span className="text-emerald-400">{icons.arrowUp}</span>}
              {card.trend === "down" && <span className="text-rose-400">{icons.arrowDown}</span>}
              <span className="text-zinc-400">{card.trendLabel}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Middle row: Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart — div-based */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold mb-1">Rekap Absensi Bulan Ini</h2>
          <p className="text-xs text-zinc-500 mb-5">
            Berdasarkan status kehadiran karyawan
          </p>
          <div className="space-y-3">
            {chartData.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">Belum ada data absensi bulan ini.</p>
            ) : (
              chartData.map((item) => {
                const pct = ((item._count.id / totalChart) * 100).toFixed(1)
                const label = statusLabels[item.status] ?? item.status
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-zinc-300">{label}</span>
                      <span className="text-zinc-500">
                        {item._count.id} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${statusColors[item.status] ?? "bg-zinc-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {/* Summary row in chart area */}
          <div className="mt-5 flex flex-wrap gap-3 text-xs text-zinc-500 border-t border-zinc-800 pt-4">
            <span>Total: <strong className="text-zinc-300">{totalChart}</strong></span>
            <span>•</span>
            <span>Bulan: <strong className="text-zinc-300">{new Intl.DateTimeFormat("id-ID", { month: "long" }).format(new Date())}</strong></span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="text-sm font-semibold mb-1">Aksi Cepat</h2>
          <p className="text-xs text-zinc-500 mb-5">Tugas umum yang sering dilakukan</p>
          <div className="space-y-3">
            {quickActions.map((act) => (
              <a
                key={act.label}
                href={act.href}
                className={`block rounded-lg px-4 py-3 text-sm font-medium text-white transition ${act.color}`}
              >
                <div>{act.label}</div>
                <div className="text-xs font-normal text-white/70 mt-0.5">{act.desc}</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold">Aktivitas Terbaru</h2>
            <p className="text-xs text-zinc-500 mt-0.5">5 absensi terakhir</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <th className="py-3 pr-4 font-medium">Karyawan</th>
                <th className="py-3 pr-4 font-medium">Tanggal</th>
                <th className="py-3 pr-4 font-medium">Check In</th>
                <th className="py-3 pr-4 font-medium">Check Out</th>
                <th className="py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-zinc-500 italic">
                    Belum ada data absensi.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3 pr-4 font-medium text-zinc-200">{r.karyawan}</td>
                    <td className="py-3 pr-4 text-zinc-400">{r.tanggal}</td>
                    <td className="py-3 pr-4 text-zinc-400">{r.checkIn}</td>
                    <td className="py-3 pr-4 text-zinc-400">{r.checkOut}</td>
                    <td className="py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${badge[r.status] ?? "bg-zinc-700 text-zinc-300 ring-zinc-600"}`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
