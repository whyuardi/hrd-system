import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import LoginForm from "./login-form"

export default async function LoginPage() {
  const session = await auth()
  if (session?.user) redirect("/")

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-[#09090b] to-zinc-950" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_50%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25">
              H
            </div>
            <span className="text-xl font-semibold text-zinc-100">HRD System</span>
          </div>
          <p className="text-sm text-zinc-500">Manajemen Karyawan Terintegrasi</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold text-zinc-100 mb-1">Selamat Datang</h1>
          <p className="text-sm text-zinc-500 mb-6">Silakan login dengan akun Anda</p>

          <LoginForm />
        </div>

        <p className="text-center text-xs text-zinc-700 mt-6">
          &copy; {new Date().getFullYear()} HRD System v1.0
        </p>
      </div>
    </div>
  )
}
