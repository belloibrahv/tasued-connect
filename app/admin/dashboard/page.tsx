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
      const { data: metrics } = await supabase.from('system_metrics').select('id, value')
      const getMetric = (id: string) => Number(metrics?.find(m => m.id === id)?.value || 0)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [
        { data: adminData },
        { data: activityData },
        { data: enrollmentData }
      ] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('attendance_records').select('*, users(first_name, last_name, matric_number), courses(code)').order('marked_at', { ascending: false }).limit(5),
        supabase.from('course_enrollments').select('attendance_percentage')
      ])

      if (enrollmentData) {
        const avg = enrollmentData.length ? Math.round(enrollmentData.reduce((acc, curr) => acc + Number(curr.attendance_percentage), 0) / enrollmentData.length) : 0
        setStats({
          totalUsers: getMetric('total_users'),
          activeSessions: getMetric('active_sessions'),
          totalCourses: getMetric('total_courses'),
          avgAttendance: avg
        })
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
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-600" },
          { label: "Active Sessions", value: stats.activeSessions, icon: Radio, color: "text-emerald-500" },
          { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, color: "text-indigo-600" },
          { label: "Avg Attendance", value: `${stats.avgAttendance}%`, icon: Activity, color: "text-amber-600" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
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
