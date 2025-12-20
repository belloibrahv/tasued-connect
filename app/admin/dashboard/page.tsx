"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  TrendingUp,
  MoreVertical,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  BarChart3,
  Search,
  Zap,
  Activity,
  Layers,
  Settings,
  Bell,
  Archive,
  Database
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts'
import { createClient } from "@/lib/supabase/client"
import { format, formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

export default function AdminDashboardPage() {
  const [admin, setAdmin] = useState<any>(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    totalCourses: 0,
    avgAttendance: 0,
    systemHealth: 100 // Mock health score
  })
  const [liveActivity, setLiveActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  // High-Performance Data Fetch
  const fetchStats = useCallback(async () => {
    try {
      // 1. Get Metrics from Cache (Instant)
      const { data: metrics } = await supabase.from('system_metrics').select('id, value')
      const getMetric = (id: string) => Number(metrics?.find(m => m.id === id)?.value || 0)

      setStats(prev => ({
        ...prev,
        totalUsers: getMetric('total_users'),
        activeSessions: getMetric('active_sessions'),
        totalCourses: getMetric('total_courses')
      }))

      // 2. Parallel Fetch for Live Activity & User Profile
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [
        { data: adminData },
        { data: activityData },
        { data: enrollmentData }
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('attendance_records').select('*, users(first_name, last_name, matric_number), courses(code)').order('marked_at', { ascending: false }).limit(7),
        supabase.from('course_enrollments').select('attendance_percentage')
      ])

      // Calculate avg attendance on the fly (optimizable later)
      if (enrollmentData) {
        const avg = enrollmentData.length ? Math.round(enrollmentData.reduce((acc, curr) => acc + Number(curr.attendance_percentage), 0) / enrollmentData.length) : 0
        setStats(prev => ({ ...prev, avgAttendance: avg }))
      }

      setAdmin(adminData)
      setLiveActivity(activityData || [])

    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchStats()

    // Real-time Subscriptions using Channel Bundling
    const channel = supabase.channel('admin_command_center')

    // Listen for Metrics Updates (Trigger-based)
    channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_metrics' }, (payload) => {
      setStats(prev => {
        const newVal = Number(payload.new.value)
        if (payload.new.id === 'total_users') return { ...prev, totalUsers: newVal }
        if (payload.new.id === 'active_sessions') return { ...prev, activeSessions: newVal }
        if (payload.new.id === 'total_courses') return { ...prev, totalCourses: newVal }
        return prev
      })
    })

    // Listen for Live Attendance (Activity Feed)
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_records' }, async (payload) => {
      // Fetch enriched data for the new record
      const { data } = await supabase.from('attendance_records')
        .select('*, users(first_name, last_name, matric_number), courses(code)')
        .eq('id', payload.new.id)
        .single()

      if (data) {
        setLiveActivity(prev => [data, ...prev].slice(0, 7))
        toast.success(`Check-in: ${data.users?.first_name} in ${data.courses?.code}`, { icon: '📡' })
      }
    })

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchStats])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 animate-pulse bg-gray-950 text-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Initializing Command Center...</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20 p-6 bg-gray-50 min-h-screen rounded-[3rem]">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-gray-900 shadow-2xl shadow-gray-900/20 flex items-center justify-center text-white font-black text-4xl border-[6px] border-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <ShieldAlert className="w-10 h-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-black uppercase tracking-widest text-[9px] py-1 px-3 shadow-sm">Administrator</Badge>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">v2.0 PRO</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-gray-900 tracking-tighter leading-none italic mb-2">
                University Overview
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-gray-500 font-bold text-xs flex items-center gap-2 uppercase tracking-widest bg-white border border-gray-100 px-3 py-1 rounded-lg">
                  <Database className="w-3 h-3 text-primary" /> DMC Active
                </span>
                <span className="text-gray-500 font-bold text-xs flex items-center gap-2 uppercase tracking-widest bg-white border border-gray-100 px-3 py-1 rounded-lg">
                  <Activity className="w-3 h-3 text-emerald-500" /> System Healthy
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="h-16 w-16 rounded-[2rem] border-gray-200 hover:border-gray-900 transition-colors flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-500" />
          </Button>
          <Link href="/admin/settings">
            <Button className="h-16 px-10 rounded-[2rem] shadow-2xl shadow-gray-900/10 bg-gray-900 hover:bg-black text-white font-black text-sm uppercase tracking-widest group active:scale-95 transition-all relative overflow-hidden flex items-center gap-3">
              <Settings className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
              System Config
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Population", value: stats.totalUsers, icon: <Users className="w-6 h-6 text-white" />, bg: "bg-gray-900", text: "text-white" },
          { label: "Active Sessions", value: stats.activeSessions, icon: <Radio className="w-6 h-6 text-white animate-pulse" />, bg: "bg-emerald-500", text: "text-white" },
          { label: "Course Catalog", value: stats.totalCourses, icon: <Layers className="w-6 h-6 text-indigo-600" />, bg: "bg-white", text: "text-gray-900" },
          { label: "Avg Attendance", value: `${stats.avgAttendance}%`, icon: <TrendingUp className="w-6 h-6 text-amber-600" />, bg: "bg-white", text: "text-gray-900" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className={cn(
              "border-none shadow-xl shadow-gray-100/50 hover:shadow-2xl transition-all rounded-[2.5rem] p-8 h-full flex flex-col justify-between group relative overflow-hidden",
              stat.bg
            )}>
              {/* Decorative Blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg", i < 2 ? "bg-white/10 backdrop-blur-md" : "bg-gray-50 border border-gray-100")}>
                  {stat.icon}
                </div>
                {i === 1 && <Badge className="bg-white/20 text-white border-none font-black text-[9px] uppercase tracking-widest animate-pulse">Live</Badge>}
              </div>
              <div className="relative z-10">
                <p className={cn("font-bold uppercase tracking-widest text-[10px] mb-1 opacity-60", stat.text)}>{stat.label}</p>
                <h3 className={cn("text-5xl font-heading font-black tracking-tighter italic", stat.text)}>{stat.value}</h3>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Activity Feed */}
        <Card className="lg:col-span-2 border-none shadow-xl shadow-gray-100/50 rounded-[3rem] bg-white overflow-hidden border border-gray-100 h-[600px] flex flex-col">
          <CardHeader className="p-10 border-b border-gray-50 bg-gray-50/20 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                <Activity className="w-4 h-4 animate-bounce" />
                <span>Live Telemetry</span>
              </div>
              <CardTitle className="text-3xl font-heading font-black tracking-tighter text-gray-900 italic">Campus Activity Feed</CardTitle>
            </div>
            <Badge variant="outline" className="bg-white border-gray-200 text-gray-500 font-bold uppercase tracking-widest text-[10px] px-3 py-1">
              Real-time Socket
            </Badge>
          </CardHeader>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
            <AnimatePresence mode="popLayout">
              {liveActivity.map((activity, i) => (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, x: -20, backgroundColor: "rgba(16, 185, 129, 0.1)" }}
                  animate={{ opacity: 1, x: 0, backgroundColor: "rgba(255, 255, 255, 1)" }}
                  transition={{ duration: 0.5 }}
                  className="p-6 border-b border-gray-50 flex items-center gap-6 hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                    {activity.courses?.code?.substring(0, 3)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-heading font-black text-lg text-gray-900 tracking-tight">
                        {activity.users?.first_name} {activity.users?.last_name}
                      </h4>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {formatDistanceToNow(new Date(activity.marked_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-2">
                      Successful check-in at <span className="font-bold text-gray-900">{activity.courses?.code}</span>
                      <Badge className="h-4 px-1 rounded bg-emerald-100 text-emerald-600 text-[9px] border-none font-black uppercase">Verified</Badge>
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {liveActivity.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-40">
                <Activity className="w-16 h-16 text-gray-300 mb-4" />
                <p className="font-bold text-gray-400">Waiting for incoming signals...</p>
              </div>
            )}
          </div>
        </Card>

        {/* System Health / Quick Actions */}
        <div className="space-y-6">
          <Card className="border-none shadow-2xl shadow-primary/20 rounded-[3rem] bg-primary text-white p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-xl italic tracking-tighter">System Health</h3>
                  <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mt-1">Operational Status</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className="opacity-60">Database Load</span>
                    <span>Minimal</span>
                  </div>
                  <Progress value={12} className="h-2 bg-black/20" indicatorClassName="bg-white" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className="opacity-60">API Latency</span>
                    <span>15ms</span>
                  </div>
                  <Progress value={5} className="h-2 bg-black/20" indicatorClassName="bg-emerald-300" />
                </div>
              </div>

              <div className="mt-10 p-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Backup Status</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span className="font-black italic tracking-wide">Synced Just Now</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/users" className="block">
              <Button className="w-full h-24 rounded-[2rem] bg-white border border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-900 shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-2 group">
                <Users className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                <span className="font-black text-[10px] uppercase tracking-widest">Manage Users</span>
              </Button>
            </Link>
            <Link href="/admin/courses" className="block">
              <Button className="w-full h-24 rounded-[2rem] bg-white border border-gray-100 hover:border-gray-300 hover:bg-gray-50 text-gray-900 shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center gap-2 group">
                <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                <span className="font-black text-[10px] uppercase tracking-widest">Catalog</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
function Radio({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1" />
    </svg>
  )
}
