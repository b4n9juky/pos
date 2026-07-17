"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Eye, EyeOff, User, HelpCircle, Lock } from "lucide-react"
import { toast } from "sonner"
import { t } from "@/lib/translate"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    const link = document.createElement("link")
    link.href =
      "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap"
    link.rel = "stylesheet"
    document.head.appendChild(link)

    const timer = setTimeout(() => setAnimate(true), 100)
    return () => {
      clearTimeout(timer)
      document.head.removeChild(link)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.ok) {
        router.push("/pos")
        router.refresh()
      } else {
        toast.error(t("Invalid email or password"))
      }
    } catch {
      toast.error(t("Something went wrong"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dark flex min-h-screen flex-col bg-background text-foreground font-['Hanken_Grotesk',system-ui,sans-serif]">
      <header className="fixed top-0 left-0 w-full flex items-center justify-between bg-background px-6 py-2 z-50 md:px-12">
        <div className="text-primary text-2xl font-semibold tracking-tight uppercase">
          EasyPOS
        </div>
        <div className="flex gap-6">
          <button
            type="button"
            tabIndex={-1}
            className="text-muted-foreground transition-opacity hover:opacity-80"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
          <button
            type="button"
            tabIndex={-1}
            className="text-muted-foreground transition-opacity hover:opacity-80"
          >
            <Lock className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex flex-grow items-center justify-center px-4">
        <div className="flex w-full max-w-[440px] flex-col items-center">
          <div
            className="flex w-full flex-col gap-6 border border-white/5 bg-card p-10 shadow-2xl"
            style={{
              opacity: animate ? 1 : 0,
              transform: animate ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div className="space-y-1 text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {t("Secure Terminal Access")}
              </h1>
              <p className="text-muted-foreground">
                {t("Authorize your session to continue")}
              </p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t("Staff ID / Email")}
                </label>
                <div className="relative">
                  <input
                    className="w-full border-b-2 border-transparent bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-emerald-600 focus:ring-0"
                    placeholder={t("Enter credentials")}
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <User className="text-border absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2" />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-['JetBrains_Mono',monospace] text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {t("Password")}
                </label>
                <div className="relative">
                  <input
                    className="w-full border-b-2 border-transparent bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:border-emerald-600 focus:ring-0"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-border hover:text-primary absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 py-3 text-lg font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? t("Signing in...") : t("Log In")}
              </button>
            </form>
          </div>

          <div className="mt-6 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            <span className="font-['JetBrains_Mono',monospace] text-xs text-muted-foreground">
              {t("System Status: Online")}
            </span>
          </div>
        </div>
      </main>

      <footer className="flex w-full flex-col items-center justify-between border-t border-white/5 bg-black/20 px-6 py-4 md:flex-row md:px-12">
          <div className="font-['JetBrains_Mono',monospace] text-xs font-bold text-foreground">
            {t("© 2024 EasyPOS Systems. All Rights Reserved.")}
          </div>
        <div className="mt-2 flex gap-4 md:mt-0">
          {[t("Support"), t("Security Protocol"), t("Terms of Service"), t("Contact")].map(
            (link) => (
              <a
                key={link}
                href="#"
                className="font-['JetBrains_Mono',monospace] text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                {link}
              </a>
            ),
          )}
        </div>
      </footer>
    </div>
  )
}
