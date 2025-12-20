"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  QrCode,
  CalendarDays,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  User,
  ExternalLink,
  ChevronRight,
  Loader2,
  Bell,
  Activity,
  ShieldCheck,
  Search,
  Layout
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
  Bar
} from 'recharts'
import { createClient } from "@/lib/supabase/client"
import { format, formatDistanceToNow, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns"
import Link from "next/link"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

export default function StudentDashboardPage() {
  const [student, setStudent] = useState<any>(null)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [weeklyTrends, setWeeklyTrends] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const calculateWeeklyTrends = useCallback((records: any[]) => {
    // Generate last 6 weeks
    const weeks = Array.from({ length: 6 }).map((_, i) => {
      const start = startOfWeek(subWeeks(new Date(), i))
      const end = endOfWeek(subWeeks(new Date(), i))
      return {
        name: `Week ${6 - i}`,
        start,
        end,
        present: 0,
        total: 0
      }
    }).reverse()

    records.forEach(record => {
      const date = new Date(record.marked_at)
      weeks.forEach(week => {
        if (isWithinInterval(date, { start: week.start, end: week.end })) {
          week.total++
          if (record.status === 'present') week.present++
        }
      })
    })

    return weeks.map(w => ({
      name: w.name,
      attendance: w.total > 0 ? Math.round((w.present / w.total) * 100) : 0
    }))
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [
        { data: studentData },
        { data: enrollmentData },
        { data: allAttendanceData }
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('course_enrollments').select('*, courses(*)').eq('student_id', user.id).eq('status', 'active'),
        supabase.from('attendance_records').select('*, courses(code, title), lecture_sessions(topic, session_date)').eq('student_id', user.id).order('marked_at', { ascending: false })
      ])

      setStudent(studentData)
      setEnrollments(enrollmentData || [])
      setActivities(allAttendanceData?.slice(0, 6) || [])
      setWeeklyTrends(calculateWeeklyTrends(allAttendanceData || []))

      // Notify if low attendance detected
      const lowAttendanceCourse = enrollmentData?.find(e => e.attendance_percentage < 75)
      if (lowAttendanceCourse) {
        toast.error(`Low attendance detected in ${lowAttendanceCourse.courses?.code}`, { icon: '⚠️', id: 'low-att-alert' })
      }
    } catch (error) {
      console.error("Error fetching student data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, calculateWeeklyTrends])

  useEffect(() => {
    fetchData()

    // Real-time updates for check-ins
    const channel = supabase
      .channel('student_dashboard_updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_records' }, () => {
        fetchData()
        toast.success("Attendance Updated!", { icon: '✅' })
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
        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Syncing Academic Profile...</p>
      </div>
    )
  }

  const attendedClasses = enrollments.reduce((acc, curr) => acc + (curr.classes_attended || 0), 0)
  const totalClasses = enrollments.reduce((acc, curr) => acc + (curr.total_classes || 0), 0)
  const attendanceRate = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Dynamic Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[2rem] bg-white shadow-2xl shadow-primary/10 flex items-center justify-center text-primary font-black text-4xl border-[6px] border-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {student?.first_name?.[0]}{student?.last_name?.[0]}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/50 hover:bg-white text-primary border-primary/10 font-black uppercase tracking-widest text-[9px] py-1 px-3 shadow-sm backdrop-blur-sm">Student Portal</Badge>
                <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest leading-none">v2.0</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-heading font-black text-gray-900 tracking-tighter leading-none italic mb-2">
                {student?.first_name} {student?.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <span className="text-gray-500 font-bold text-xs flex items-center gap-2 uppercase tracking-widest bg-gray-100/50 px-3 py-1 rounded-lg">
                  <User className="w-3 h-3 text-primary" /> {student?.matric_number}
                </span>
                <span className="text-gray-500 font-bold text-xs flex items-center gap-2 uppercase tracking-widest bg-gray-100/50 px-3 py-1 rounded-lg">
                  <BookOpen className="w-3 h-3 text-primary" /> {student?.department}
                </span>
                <Badge className="bg-amber-500 text-white border-none font-black text-[9px] rounded-lg px-2 uppercase tracking-widest shadow-lg shadow-amber-500/20">L{student?.level}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/student/scan">
            <Button className="h-16 px-10 rounded-[2rem] shadow-2xl shadow-primary/30 bg-gray-900 hover:bg-black text-white font-black text-sm uppercase tracking-widest group active:scale-95 transition-all relative overflow-hidden flex items-center gap-3">
              <QrCode className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Scan Attendance
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-emerald-500 to-teal-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-none shadow-xl shadow-gray-100/50 rounded-[3rem] bg-white overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500">
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between p-10 border-b border-gray-50 bg-gray-50/20 gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                  <Activity className="w-4 h-4" />
                  <span>Performance Matrix</span>
                </div>
                <CardTitle className="text-3xl font-heading font-black tracking-tighter text-gray-900 italic">Attendance Velocity</CardTitle>
                <CardDescription className="font-medium text-gray-500">Your engagement trends over the last 6 weeks.</CardDescription>
              </div>
              <Badge className={cn(
                "border-none font-black p-4 px-6 rounded-2xl shadow-sm uppercase tracking-widest text-[10px] flex items-center gap-3 transition-colors",
                attendanceRate >= 75 ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100" : "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
              )}>
                {attendanceRate >= 75 ? <TrendingUp className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <div>
                  <p className="opacity-50 text-[9px]">Current Standing</p>
                  <p className="text-sm">{attendanceRate >= 75 ? 'Optimal' : 'At Risk'}</p>
                </div>
              </Badge>
            </CardHeader>
            <CardContent className="p-10">
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyTrends}>
                    <defs>
                      <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#047857" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dx={-10} />
                    <Tooltip
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '20px', backgroundColor: '#fff' }}
                      cursor={{ stroke: '#047857', strokeWidth: 2, strokeDasharray: '5 5' }}
                    />
                    <Area type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorAttendance)" animationDuration={1500} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <div>
                <h3 className="text-2xl font-heading font-black text-gray-900 tracking-tighter italic">Active Courses</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Enrollment Status Overview</p>
              </div>
              <Link href="/student/courses" className="h-10 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-all">
                Full Catalog <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {enrollments.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={cn(
                    "border-none shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all rounded-[2.5rem] bg-white p-8 group cursor-pointer border border-gray-100 relative overflow-hidden",
                    item.attendance_percentage < 75 && "border-rose-100 bg-rose-50/10 shadow-rose-100/20"
                  )}>
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-700">
                      <BookOpen className="w-24 h-24 text-gray-900" />
                    </div>
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm",
                        item.attendance_percentage < 75 ? "bg-rose-100 text-rose-600" : "bg-gray-900 text-white"
                      )}>
                        {item.attendance_percentage < 75 ? <AlertCircle className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
                      </div>
                      <Badge variant="outline" className="rounded-xl font-black uppercase text-[9px] tracking-widest py-1.5 px-3 bg-white border-gray-100/50 backdrop-blur-md">CC: {item.courses?.code}</Badge>
                    </div>
                    <div className="relative z-10">
                      <h4 className="font-heading font-black text-gray-900 text-xl leading-tight mb-1 tracking-tight line-clamp-1">{item.courses?.title}</h4>
                      <p className="text-[10px] text-gray-400 font-bold mb-8 uppercase tracking-widest">Level {item.courses?.level} • 3 Units</p>

                      <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                          <span className="text-gray-400">Attendance Yield</span>
                          <span className={cn(item.attendance_percentage >= 75 ? "text-emerald-600" : "text-rose-600")}>
                            {Math.round(item.attendance_percentage)}%
                          </span>
                        </div>
                        <div className="relative h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.attendance_percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={cn("h-full rounded-full shadow-lg", item.attendance_percentage >= 75 ? "bg-emerald-500" : "bg-rose-500")}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          <Card className="border-none shadow-2xl shadow-primary/30 rounded-[3rem] bg-gray-900 text-white p-10 relative overflow-hidden group">
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-primary/30 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-xl tracking-tighter italic leading-none">Global Yield</h3>
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Overall Participation</p>
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-10">
                <span className="text-7xl font-heading font-black italic tracking-tighter text-white">{attendanceRate}%</span>
                <span className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Total</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-1">Present</p>
                  <p className="text-2xl font-black">{attendedClasses}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-1">Total</p>
                  <p className="text-2xl font-black">{totalClasses}</p>
                </div>
              </div>

              <Button className="w-full mt-10 h-14 rounded-2xl bg-primary hover:bg-white hover:text-gray-900 text-white border-none font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-primary/20">
                Detailed Report
              </Button>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[3rem] bg-white overflow-hidden border border-gray-100 flex flex-col h-[500px]">
            <CardHeader className="p-8 border-b border-gray-50 bg-gray-50/20 flex flex-row items-center justify-between sticky top-0 z-10 backdrop-blur-md">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-[10px]">
                  <Activity className="w-3 h-3 animate-pulse" />
                  <span>Live Feed</span>
                </div>
                <CardTitle className="text-xl font-heading font-black text-gray-900 italic tracking-tight">Recent Scans</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto custom-scrollbar flex-1">
              <div className="divide-y divide-gray-50">
                <AnimatePresence initial={false}>
                  {activities.map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-6 flex items-start gap-5 hover:bg-gray-50 transition-all cursor-pointer group"
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-transform group-hover:scale-110",
                        activity.status === 'present' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {activity.status === 'present' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-baseline mb-1">
                          <p className="font-heading font-black text-gray-900 text-sm tracking-tight truncate pr-4">{activity.courses?.code}</p>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest shrink-0">
                            {formatDistanceToNow(new Date(activity.marked_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium line-clamp-1">{activity.lecture_sessions?.topic}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="border-gray-100 text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-white">
                            {format(new Date(activity.marked_at), 'HH:mm aaa')}
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {activities.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-50 p-10 text-center">
                    <Activity className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="font-bold text-gray-400 text-sm">No activity recorded yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-8 flex items-start gap-6 relative overflow-hidden group cursor-pointer hover:shadow-lg hover:shadow-amber-100 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-32 h-32 text-amber-600 rotate-12" />
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-xl shadow-amber-500/10 z-10 shrink-0">
              <ShieldCheck className="w-8 h-8 text-amber-600" />
            </div>
            <div className="z-10 relative">
              <h4 className="font-heading font-black text-gray-900 text-lg tracking-tight italic">Biometric Integrity</h4>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed font-medium">Verify your high-fidelity profile data for seamless face-matching during sessions.</p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-900 group-hover:gap-4 transition-all">
                Configure Profile <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
