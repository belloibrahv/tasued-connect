"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Camera, CheckCircle, UserPlus, ArrowRight, Scan, BookOpen, Users, GraduationCap } from "lucide-react"
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
      <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link className="flex items-center gap-3" href="/">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Scan className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-gray-900 text-lg">FaceCheck</span>
              <p className="text-xs text-gray-500">TASUED CSC 415</p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-2">
            {user ? (
              <Link href="/student/dashboard">
                <Button size="sm" className="rounded-full px-6 h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg transition-shadow">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="text-gray-600 h-10 hover:bg-gray-100">Login</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="rounded-full px-6 h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg transition-shadow">Get Started</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {/* Hero Section with Background */}
        <section className="w-full relative overflow-hidden">
          {/* Background Layer */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 opacity-95" />
            <Image
              src="https://tasued.edu.ng/web/wp-content/uploads/2020/07/DSC_0395.jpg"
              alt="TASUED Students"
              fill
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50" />
          </div>

          {/* Content */}
          <div className="relative z-10 py-16 md:py-24 lg:py-32">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm mb-6 md:mb-8">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  CSC 415 Project • TASUED • 2024/2025
                </div>

                {/* Headline */}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 md:mb-6">
                  No more proxy attendance
                </h1>

                {/* Subheadline */}
                <p className="text-lg md:text-xl text-gray-200 mb-8 md:mb-10 max-w-2xl leading-relaxed">
                  Verify your identity with a quick face scan. Your face is your attendance signature. Built with cutting-edge facial recognition technology.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href={user ? "/student/dashboard" : "/register"} className="w-full sm:w-auto">
                    <Button size="lg" className="w-full px-8 h-12 rounded-full font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:shadow-2xl transition-all hover:scale-105">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="#how-it-works" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full px-8 h-12 rounded-full font-semibold border-white/30 text-white hover:bg-white/10">
                      Learn More
                    </Button>
                  </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mt-12 md:mt-16 pt-12 md:pt-16 border-t border-white/10">
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-white">180+</p>
                    <p className="text-sm text-gray-300">Students</p>
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-white">99.8%</p>
                    <p className="text-sm text-gray-300">Accuracy</p>
                  </div>
                  <div>
                    <p className="text-2xl md:text-3xl font-bold text-white">&lt;1s</p>
                    <p className="text-sm text-gray-300">Verification</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="w-full py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">How it works</h2>
              <p className="text-gray-600 text-lg">Three simple steps to verified attendance</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  icon: UserPlus,
                  title: "Register your face",
                  description: "Sign up and capture your face in good lighting. One-time setup that takes just 30 seconds."
                },
                {
                  step: "02",
                  icon: Camera,
                  title: "Scan to verify",
                  description: "When class starts, open the app and scan your face to prove it's really you."
                },
                {
                  step: "03",
                  icon: CheckCircle,
                  title: "Attendance marked",
                  description: "Face matched? You're marked present instantly. No match? No attendance recorded."
                }
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white rounded-2xl p-8 border border-gray-200 group-hover:border-purple-300 transition-all duration-300 h-full">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4">
                      {item.step}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <item.icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Course Information Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-6">
                {/* TASUED Logo & Department */}
                <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                  <Image 
                    src="https://tasued.edu.ng/web/wp-content/uploads/2023/03/logo3-1.png" 
                    alt="TASUED Logo"
                    width={64}
                    height={64}
                    className="h-16 w-auto bg-white rounded-xl p-2 shadow-lg"
                  />
                  <div>
                    <h3 className="text-white font-bold text-xl">TASUED</h3>
                    <p className="text-gray-300 text-sm">Department of Computer Science</p>
                  </div>
                </div>

                {/* Course Title */}
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">CSC 415</h2>
                  <p className="text-xl text-gray-200">Net-Centric Computing</p>
                </div>

                {/* Course Details with Icons */}
                <div className="space-y-4">
                  {/* Lecturer Info */}
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="text-purple-300" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">Course Lecturer</p>
                      <p className="text-white font-semibold">Dr. Ogunsanwo</p>
                    </div>
                  </div>

                  {/* Course Code */}
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="text-emerald-300" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">Course Code</p>
                      <p className="text-white font-semibold">CSC 415</p>
                    </div>
                  </div>

                  {/* Academic Session */}
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="text-blue-300" size={24} />
                    </div>
                    <div>
                      <p className="text-gray-300 text-sm">Academic Session</p>
                      <p className="text-white font-semibold">2024/2025</p>
                    </div>
                  </div>
                </div>

                {/* Course Description */}
                <p className="text-gray-300 leading-relaxed pt-4 border-t border-white/10">
                  This project demonstrates the practical application of net-centric computing concepts through facial recognition technology. Students have built a robust attendance system that combines modern web technologies with biometric authentication.
                </p>
              </div>

              {/* Right Image */}
              <div className="relative hidden md:block">
                <div className="relative h-96 rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/images/drogunsanwo.png"
                    alt="Dr. Ogunsanwo"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-900 to-transparent">
                    <p className="text-white font-semibold text-lg">Dr. Ogunsanwo</p>
                    <p className="text-gray-300 text-sm">Course Lecturer & Project Supervisor</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="w-full py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Our Team</h2>
              <p className="text-gray-600 text-lg">180+ talented students from CSC 415 • Net-Centric Computing</p>
            </div>
            <TeamCarousel />
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Why FaceCheck?</h2>
              <p className="text-gray-600 text-lg">Built with modern technology and best practices</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Fast", description: "Verify attendance in under 1 second" },
                { title: "Accurate", description: "99.8% facial recognition accuracy" },
                { title: "Secure", description: "Enterprise-grade encryption" },
                { title: "Reliable", description: "99.9% uptime guarantee" },
              ].map((feature, i) => (
                <div key={i} className="p-6 bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 md:py-24 bg-gradient-to-r from-purple-600 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-white/90 mb-8 text-lg max-w-2xl mx-auto">
              Register your face once and mark attendance with a quick scan. Join 180+ students already using FaceCheck.
            </p>
            <Link href="/register">
              <Button size="lg" className="px-8 h-12 rounded-full font-semibold bg-white text-purple-600 hover:bg-gray-100 hover:shadow-2xl transition-all hover:scale-105">
                Create Account Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 md:py-12 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Scan className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">FaceCheck</span>
              </div>
              <p className="text-gray-400 text-sm">Facial recognition attendance system</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Features</Link></li>
                <li><Link href="#" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition">About</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition">Cookies</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © 2025 FaceCheck. CSC 415 • Net-Centric Computing • TASUED
            </p>
            <p className="text-sm text-gray-400">
              Built by 180+ students from the Department of Computer Science
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
