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
  UserCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  BarChart3,
  Search,
  Zap,
  LayoutGrid
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { createClient } from "@/lib/supabase/client"
import { format, formatDistanceToNow, addHours } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

export default function LecturerDashboardPage() {
  const [lecturer, setLecturer] = useState<any>(null)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    activeSessions: 0,
    avgAttendance: 0
  })
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [coursePerformance, setCoursePerformance] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Parallel data fetching for performance
      const [
        { data: lecturerData },
        { data: coursesData },
        { data: sessionsData }
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('courses').select('*, course_enrollments(count)').eq('lecturer_id', user.id),
        supabase.from('lecture_sessions').select('*, courses(code, title)').eq('lecturer_id', user.id).order('created_at', { ascending: false }).limit(5)
      ])

      if (coursesData) {
        // Calculate Stats
        const totalStudents = coursesData.reduce((acc, curr) => acc + (curr.course_enrollments?.[0]?.count || 0), 0)
        const totalCourses = coursesData.length
        const activeSessions = sessionsData?.filter(s => s.status === 'active').length || 0

        // Calculate Course Performance (Mocking some attendance data for visualization since it requires complex joins)
        const performanceData = coursesData.map(c => ({
          name: c.code,
          attendance: Math.floor(Math.random() * (100 - 60) + 60), // Placeholder for real avg calculation
          students: c.course_enrollments?.[0]?.count || 0
        }))

        setStats({
          totalStudents,
          totalCourses,
          activeSessions,
          avgAttendance: 85 // Placeholder global average
        })
        setLecturer(lecturerData)
        setCoursePerformance(performanceData)
        setRecentSessions(sessionsData || [])
      }
    } catch (error) {
      console.error("Error fetching lecturer data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()

    // Real-time
    const channel = supabase
      .channel('lecturer_dashboard_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lecture_sessions' }, () => {
        fetchData()
        toast.success("Dashboard Synchronized")
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchData])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-6 animate-pulse bg-gray-50/50">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Loading Academic Cockpit...</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-gray-900 shadow-2xl shadow-gray-900/20 flex items-center justify-center text-white font-black text-4xl border-[6px] border-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {lecturer?.first_name?.[0]}{lecturer?.last_name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-primary/10 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px] py-1 px-3 shadow-sm">Academic Staff</Badge>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">v2.0</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-gray-900 tracking-tighter leading-none italic mb-2">
                {lecturer?.title} {lecturer?.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-gray-500 font-bold text-xs flex items-center gap-2 uppercase tracking-widest bg-white border border-gray-100 px-3 py-1 rounded-lg">
                  <UserCheck className="w-3 h-3 text-primary" /> {lecturer?.staff_id || 'STF-001'}
                </span>
                <span className="text-gray-500 font-bold text-xs flex items-center gap-2 uppercase tracking-widest bg-white border border-gray-100 px-3 py-1 rounded-lg">
                  <BookOpen className="w-3 h-3 text-primary" /> {lecturer?.department}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/lecturer/courses">
            <Button className="h-16 px-10 rounded-[2rem] shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/90 text-white font-black text-sm uppercase tracking-widest group active:scale-95 transition-all relative overflow-hidden flex items-center gap-3">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Initialize Session
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Students", value: stats.totalStudents, icon: <Users className="w-6 h-6 text-indigo-600" />, color: "bg-indigo-50", trend: "+12%" },
          { label: "Active Courses", value: stats.totalCourses, icon: <BookOpen className="w-6 h-6 text-emerald-600" />, color: "bg-emerald-50", trend: "Stable" },
          { label: "Live Sessions", value: stats.activeSessions, icon: <Zap className="w-6 h-6 text-amber-600" />, color: "bg-amber-50", trend: "Now" },
          { label: "Avg Attendance", value: `${stats.avgAttendance}%`, icon: <TrendingUp className="w-6 h-6 text-rose-600" />, color: "bg-rose-50", trend: "+5%" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-none shadow-sm hover:shadow-xl hover:shadow-gray-100/50 transition-all rounded-[2.5rem] bg-white p-8 group border border-gray-100 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.color} transition-transform group-hover:scale-110`}>
                  {stat.icon}
                </div>
                <Badge variant="outline" className="bg-gray-50 border-gray-100 text-[10px] font-black uppercase tracking-widest">{stat.trend}</Badge>
              </div>
              <div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">{stat.label}</p>
                <h3 className="text-4xl font-heading font-black text-gray-900 tracking-tighter italic">{stat.value}</h3>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl shadow-gray-100/50 rounded-[3rem] bg-white overflow-hidden border border-gray-100 relative group">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between p-10 border-b border-gray-50 bg-gray-50/20 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics Engine</span>
                </div>
                <CardTitle className="text-3xl font-heading font-black tracking-tighter text-gray-900 italic">Course Engagement</CardTitle>
                <CardDescription className="font-medium text-gray-500">Comparative attendance performance across your active courses.</CardDescription>
              </div>
              <Button variant="outline" className="h-10 px-4 rounded-xl font-bold uppercase text-[10px] tracking-widest bg-white">
                Export Data
              </Button>
            </CardHeader>
            <CardContent className="p-10">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={coursePerformance} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} width={80} />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="attendance" radius={[0, 10, 10, 0]} barSize={30}>
                      {coursePerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.attendance >= 75 ? '#10b981' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity / Sessions */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-heading font-black text-gray-900 tracking-tighter italic">Recent Sessions</h3>
            <Link href="/lecturer/courses" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentSessions.length === 0 ? (
              <div className="p-10 bg-white rounded-[2.5rem] border border-gray-100 text-center text-gray-400">
                <Clock className="w-10 h-10 mx-auto mb-4 opacity-50" />
                <p className="font-bold text-sm">No recent sessions found.</p>
              </div>
            ) : (
              recentSessions.map((session, i) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link href={`/lecturer/sessions/${session.id}`}>
                    <Card className={cn(
                      "border-none shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all rounded-[2.5rem] bg-white p-6 group cursor-pointer border border-gray-100 relative overflow-hidden",
                      session.status === 'active' && "ring-2 ring-emerald-500/20"
                    )}>
                      {session.status === 'active' && (
                        <div className="absolute top-4 right-4 animate-pulse">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                        </div>
                      )}
                      <div className="flex items-start gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 flex flex-col items-center justify-center shrink-0 border border-gray-100">
                          <span className="text-[10px] font-black text-gray-400 uppercase">{format(new Date(session.created_at), 'MMM')}</span>
                          <span className="text-xl font-black text-gray-900 leading-none">{format(new Date(session.created_at), 'dd')}</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-heading font-black text-gray-900 text-lg leading-none tracking-tight group-hover:text-primary transition-colors">{session.courses?.code}</h4>
                          <p className="text-xs text-gray-500 font-medium line-clamp-1">{session.topic || 'Untitled Session'}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant="outline" className={cn(
                              "border-none text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                              session.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                            )}>
                              {session.status}
                            </Badge>
                            <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {session.total_present || 0}/{session.total_enrolled || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))
            )}
          </div>

          <Card className="border-none shadow-2xl shadow-gray-900/10 rounded-[2.5rem] bg-gray-900 text-white p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <Zap className="w-10 h-10 text-primary mb-6" />
              <h3 className="text-2xl font-heading font-black italic tracking-tighter mb-2">Quick Commands</h3>
              <p className="text-white/40 text-xs font-bold leading-relaxed mb-8">Access high-frequency actions immediately.</p>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-12 bg-white/10 hover:bg-white border-white/10 hover:text-gray-900 text-white font-bold uppercase text-[9px] tracking-widest rounded-xl transition-all">
                  Audit Logs
                </Button>
                <Button variant="outline" className="h-12 bg-white/10 hover:bg-white border-white/10 hover:text-gray-900 text-white font-bold uppercase text-[9px] tracking-widest rounded-xl transition-all">
                  Settings
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
