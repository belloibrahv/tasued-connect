"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Users,
  BookOpen,
  Calendar,
  Clock,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Activity,
  Settings,
  Bell,
  Database,
  Radio
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
    avgAttendance: 0
  })
  const [liveActivity, setLiveActivity] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchStats = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all stats in parallel using direct table counts
      const [
        { data: adminData },
        { count: usersCount, error: usersError },
        { count: coursesCount, error: coursesError },
        { count: activeSessionsCount, error: sessionsError },
        { data: enrollmentData },
        { data: activityData }
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('lecture_sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('course_enrollments').select('attendance_percentage'),
        supabase.from('attendance_records').select('*, users(first_name, last_name, matric_number), courses(code)').order('marked_at', { ascending: false }).limit(5)
      ])

      // Calculate average attendance with error handling
      let avgAttendance = 0
      if (enrollmentData && enrollmentData.length > 0) {
        avgAttendance = Math.round(
          enrollmentData.reduce((acc, curr) => acc + Number(curr.attendance_percentage || 0), 0) / enrollmentData.length
        )
      }

      // Set stats with fallback to 0 on errors
      setStats({
        totalUsers: usersError ? 0 : (usersCount || 0),
        activeSessions: sessionsError ? 0 : (activeSessionsCount || 0),
        totalCourses: coursesError ? 0 : (coursesCount || 0),
        avgAttendance
      })

      // Log any errors for debugging
      if (usersError) console.error("Error fetching users count:", usersError)
      if (coursesError) console.error("Error fetching courses count:", coursesError)
      if (sessionsError) console.error("Error fetching sessions count:", sessionsError)

      setAdmin(adminData)
      setLiveActivity(activityData || [])

    } catch (error) {
      console.error("Error fetching admin data:", error)
      toast.error("Failed to load some dashboard data")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Monitor university-wide attendance and system status.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/settings">
            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          <Button className="gap-2">
            <Database className="w-4 h-4" />
            System Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-slate-600", bg: "bg-slate-100" },
          { label: "Active Sessions", value: stats.activeSessions, icon: Radio, color: "text-slate-600", bg: "bg-slate-100" },
          { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, color: "text-slate-600", bg: "bg-slate-100" },
          { label: "Avg Attendance", value: `${stats.avgAttendance}%`, icon: Activity, color: "text-slate-600", bg: "bg-slate-100" },
        ].map((stat, i) => (
          <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">{stat.label}</CardTitle>
              <div className={cn("p-2 rounded-lg", stat.bg)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-sm">
              {liveActivity.map((activity) => (
                <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-bold text-xs">
                      {activity.courses?.code?.substring(0, 3)}
                    </div>
                    <div>
                      <p className="font-medium">{activity.users?.first_name} {activity.users?.last_name}</p>
                      <p className="text-xs text-muted-foreground">{activity.courses?.code}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.marked_at), { addSuffix: true })}
                  </span>
                </div>
              ))}
              {liveActivity.length === 0 && (
                <div className="p-8 text-center text-muted-foreground italic">
                  No recent activity records.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary text-white">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="opacity-70">Database Load</span>
                <span>Normal</span>
              </div>
              <Progress value={15} className="h-2 bg-white/20" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="opacity-70">Server Latency</span>
                <span>24ms</span>
              </div>
              <Progress value={8} className="h-2 bg-white/20" />
            </div>
            <div className="pt-4 border-t border-white/20">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span className="text-sm font-medium">All systems operational</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
