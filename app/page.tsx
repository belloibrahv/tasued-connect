"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight, QrCode, BarChart3, Users, Zap, Loader2, LayoutDashboard, ShieldCheck, GraduationCap, School } from "lucide-react"
import { TeamCarousel } from "@/components/team/TeamCarousel"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function getAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        setUser({ ...user, role: userData?.role })
      }
      setLoading(false)
    }
    getAuth()
  }, [supabase])

  const dashboardHref = user?.role === 'admin'
    ? '/admin/dashboard'
    : user?.role === 'lecturer'
      ? '/lecturer/dashboard'
      : '/student/dashboard'

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <QrCode className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-heading font-black tracking-tight text-gray-900">AttendX<span className="text-primary text-[2rem] leading-none">.</span></span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors uppercase tracking-widest">Platform</Link>
              <Link href="#impact" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors uppercase tracking-widest">Impact</Link>
              <Link href="#team" className="text-sm font-bold text-gray-500 hover:text-primary transition-colors uppercase tracking-widest">Team</Link>
            </div>

            <div className="flex items-center gap-4">
              {loading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : user ? (
                <Link href={dashboardHref}>
                  <Button className="h-11 px-6 rounded-xl bg-gray-900 hover:bg-black text-white font-bold uppercase tracking-widest text-[11px] shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Enter Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:block text-sm font-bold text-gray-900 hover:text-primary transition-colors uppercase tracking-widest">
                    Sign In
                  </Link>
                  <Link href="/register">
                    <Button className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-primary/30 transition-all active:scale-95 ring-[3px] ring-primary/20 ring-offset-2 ring-offset-white">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-100 mb-8"
          >
            <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-md">New v2.0</Badge>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tai Solarin University of Education</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-heading font-black text-gray-900 tracking-tighter leading-[0.9] mb-8"
          >
            Attendance<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-500 to-teal-500">Reimagined.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-2xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed mb-12"
          >
            Join the digital revolution at TASUED. Secure, real-time biometric attendance tracking designed for the modern academic campus.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {user ? (
              <Link href={dashboardHref} className="w-full sm:w-auto">
                <Button className="w-full h-16 px-10 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3">
                  <LayoutDashboard className="w-5 h-5" />
                  Launch Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/register" className="w-full sm:w-auto">
                <Button className="w-full h-16 px-10 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:bg-primary/90 transition-all flex items-center justify-center gap-3">
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Link href="#features" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full h-16 px-10 rounded-2xl border-2 border-gray-100 text-gray-500 hover:text-gray-900 font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-all">
                Learn More
              </Button>
            </Link>
          </motion.div>

          {/* Metrics Strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-20 pt-10 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            <div>
              <p className="text-3xl font-black text-gray-900">10k+</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Active Students</p>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">100%</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Digital Coverage</p>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">5ms</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Scan Latency</p>
            </div>
            <div>
              <p className="text-3xl font-black text-gray-900">24/7</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">System Uptime</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-heading font-black text-gray-900 tracking-tight mb-4">Features that empower.</h2>
            <p className="text-lg text-gray-500 font-medium">Everything you need to manage academic attendance at scale.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-amber-500" />,
                title: "Lightning Fast",
                desc: "Optimized for high-concurrency. Process thousands of student check-ins simultaneously without lag.",
                color: "bg-amber-50"
              },
              {
                icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
                title: "Secure & Verified",
                desc: "Biometric and location-aware validation ensures attendance integrity. No more buddy punching.",
                color: "bg-emerald-50"
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
                title: "Deep Analytics",
                desc: "Real-time dashboards provide actionable insights into student engagement and course performance.",
                color: "bg-blue-50"
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-gray-100/50 border border-gray-100"
              >
                <div className={`w-20 h-20 ${feature.color} rounded-[1.5rem] flex items-center justify-center mb-8`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team & Context */}
      <div id="team">
        <TeamCarousel />
      </div>

      {/* Institutional Context */}
      <section id="impact" className="py-32 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://tasued.edu.ng/web/wp-content/uploads/2023/03/logo3-1.png')] bg-no-repeat bg-center opacity-5 grayscale bg-[length:800px_800px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-16">
            <div className="md:w-1/2">
              <div className="inline-flex items-center gap-2 mb-6">
                <School className="w-6 h-6 text-primary" />
                <span className="text-primary font-bold uppercase tracking-widest text-xs">Partner Institution</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-heading font-black tracking-tighter mb-8 leading-none">
                Tai Solarin University<br />of Education
              </h2>
              <p className="text-xl text-gray-400 font-medium mb-10 max-w-lg">
                Leading the way in digital academic innovation. Powered by the Department of Computer Science.
              </p>
              <Button className="h-14 px-8 rounded-xl bg-white text-gray-900 hover:bg-gray-100 font-black uppercase tracking-widest text-xs">
                Visit Official Website
              </Button>
            </div>
            <div className="md:w-1/2">
              <div className="bg-white/5 backdrop-blur-2xl p-10 rounded-[3rem] border border-white/10 shadow-2xl">
                <div className="flex items-center gap-8 mb-8">
                  <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center font-bold text-3xl text-white">
                    4
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Target Course</p>
                    <p className="text-2xl font-black">CSC 415</p>
                  </div>
                </div>
                <hr className="border-white/10 mb-8" />
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Topic</span>
                    <span className="text-lg font-bold">Net-Centric Computing</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Lead</span>
                    <span className="text-lg font-bold">Dr. Ogunsanwo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white pt-20 pb-10 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-heading font-black text-gray-900 tracking-tight">AttendX.</span>
              </div>
              <p className="text-gray-500 font-medium max-w-sm">
                The future of academic attendance is here. Secure, fast, and data-driven.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 uppercase tracking-widest text-xs mb-6">Platform</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-500">
                <li><Link href="/login" className="hover:text-primary">Login</Link></li>
                <li><Link href="/register" className="hover:text-primary">Register</Link></li>
                <li><Link href="#" className="hover:text-primary">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 uppercase tracking-widest text-xs mb-6">Legal</h4>
              <ul className="space-y-4 text-sm font-medium text-gray-500">
                <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 text-center">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} TASUED AttendX. Engineered with ❤️ by the CSC 415 Team.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
