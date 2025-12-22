"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Camera, CheckCircle, UserPlus, ArrowRight, Scan } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { TeamCarousel } from "@/components/home/TeamCarousel"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getAuth()
  }, [supabase])

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link className="flex items-center gap-2" href="/">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <Scan className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">FaceCheck</span>
          </Link>
          
          <nav className="flex items-center gap-2">
            {user ? (
              <Link href="/student/dashboard">
                <Button size="sm" className="rounded-full px-4 h-9">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-600 h-9">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="rounded-full px-4 h-9">Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-14">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-20 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                CSC 415 Project • TASUED
              </div>

              {/* Headline */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                No more proxy attendance
              </h1>

              {/* Subheadline */}
              <p className="text-base md:text-lg text-gray-500 max-w-md mx-auto">
                Verify your identity with a quick face scan. 
                Your face is your attendance signature.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href={user ? "/student/dashboard" : "/register"}>
                  <Button size="lg" className="w-full sm:w-auto px-6 h-11 rounded-full font-medium">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">How it works</h2>
              <p className="text-gray-500 text-sm">Three steps to verified attendance</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              {[
                {
                  step: "1",
                  icon: UserPlus,
                  title: "Register your face",
                  description: "Sign up and capture your face. One-time setup that takes 30 seconds."
                },
                {
                  step: "2",
                  icon: Camera,
                  title: "Scan to verify",
                  description: "When class starts, open the app and scan your face to prove it's you."
                },
                {
                  step: "3",
                  icon: CheckCircle,
                  title: "Attendance marked",
                  description: "Face matched? You're marked present. No match? No attendance."
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 border border-gray-100"
                >
                  <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="w-full py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Built by Students</h2>
              <p className="text-gray-500 text-sm">CSC 415 • Net-Centric Computing • Class of 2025</p>
            </div>
            <TeamCarousel />
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-20 bg-gray-900">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ready to get started?
            </h2>
            <p className="text-gray-400 mb-6 text-sm max-w-sm mx-auto">
              Register your face once and mark attendance with a quick scan.
            </p>
            <Link href="/register">
              <Button size="lg" className="px-6 h-11 rounded-full font-medium bg-white text-gray-900 hover:bg-gray-100">
                Create Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
                <Scan className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium text-gray-900 text-sm">FaceCheck</span>
            </div>
            <p className="text-xs text-gray-400">
              CSC 415 • Net-Centric Computing • TASUED 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
