"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Camera, User, LogOut, Fingerprint } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

export function StudentNav() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const links = [
    { href: "/student/dashboard", label: "Home", icon: Home },
    { href: "/student/scan", label: "Scan", icon: Camera },
    { href: "/student/profile", label: "Profile", icon: User },
  ]

  return (
    <>
      {/* Top Header - Desktop */}
      <header className="hidden md:block border-b bg-white sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link href="/student/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Fingerprint className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">AttendEase</span>
            </Link>

            <div className="flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive ? "bg-primary/10 text-primary" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                )
              })}
              <Button variant="ghost" size="sm" onClick={signOut} className="ml-2 text-gray-500">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-4">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            const isScan = link.href === "/student/scan"
            
            if (isScan) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col items-center justify-center -mt-6"
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                    isActive ? "bg-primary" : "bg-primary"
                  }`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-primary mt-1">{link.label}</span>
                </Link>
              )
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center py-2 px-4 ${
                  isActive ? "text-primary" : "text-gray-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium mt-1">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
