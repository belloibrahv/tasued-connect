"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Download, MoreVertical, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"

interface StudentAttendance {
  id: string
  first_name: string
  last_name: string
  matric_number: string
  attendance_count: number
  total_sessions: number
  attendance_percentage: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
}

interface CourseStats {
  total_enrolled: number
  average_attendance: number
  this_week_present: number
  at_risk_count: number
}

export default function LecturerCourseDetailsPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [course, setCourse] = useState<any>(null)
  const [students, setStudents] = useState<StudentAttendance[]>([])
  const [stats, setStats] = useState<CourseStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchCourseData = useCallback(async () => {
    try {
      setIsLoading(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', params.id)
        .eq('lecturer_id', user.id)
        .single()

      if (courseError || !courseData) {
        throw new Error("Course not found or you don't have access")
      }

      setCourse(courseData)

      // Fetch enrolled students
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('student_id, users(id, first_name, last_name, matric_number)')
        .eq('course_id', params.id)
        .eq('status', 'active')

      if (enrollError) throw enrollError

      // Get all sessions for this course
      const { data: sessions, error: sessionsError } = await supabase
        .from('lecture_sessions')
        .select('id')
        .eq('course_id', params.id)

      if (sessionsError) throw sessionsError

      const sessionIds = sessions?.map(s => s.id) || []
      const totalSessions = sessionIds.length

      // Fetch attendance records for all students
      let attendanceData: any[] = []
      if (sessionIds.length > 0) {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('student_id, is_present')
          .in('session_id', sessionIds)

        if (error) throw error
        attendanceData = data || []
      }

      // Calculate attendance for each student
      const studentStats: StudentAttendance[] = (enrollments || []).map((enrollment: any) => {
        const studentId = enrollment.student_id
        const user = enrollment.users

        // Count present sessions
        const presentCount = attendanceData.filter(
          a => a.student_id === studentId && a.is_present === true
        ).length

        const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0

        // Determine status
        let status: 'excellent' | 'good' | 'warning' | 'critical'
        if (percentage >= 80) status = 'excellent'
        else if (percentage >= 70) status = 'good'
        else if (percentage >= 60) status = 'warning'
        else status = 'critical'

        return {
          id: studentId,
          first_name: user?.first_name || 'Unknown',
          last_name: user?.last_name || 'User',
          matric_number: user?.matric_number || 'N/A',
          attendance_count: presentCount,
          total_sessions: totalSessions,
          attendance_percentage: percentage,
          status
        }
      })

      setStudents(studentStats)

      // Calculate stats
      const totalEnrolled = studentStats.length
      const avgAttendance = totalEnrolled > 0
        ? Math.round(studentStats.reduce((sum, s) => sum + s.attendance_percentage, 0) / totalEnrolled)
        : 0

      // Get this week's sessions (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: thisWeekSessions } = await supabase
        .from('lecture_sessions')
        .select('id')
        .eq('course_id', params.id)
        .gte('session_date', sevenDaysAgo.toISOString())

      let thisWeekPresent = 0
      if (thisWeekSessions && thisWeekSessions.length > 0) {
        const { data: thisWeekAttendance } = await supabase
          .from('attendance_records')
          .select('id')
          .in('session_id', thisWeekSessions.map(s => s.id))
          .eq('is_present', true)

        thisWeekPresent = thisWeekAttendance?.length || 0
      }

      // Count at-risk students (attendance < 60%)
      const atRiskCount = studentStats.filter(s => s.attendance_percentage < 60).length

      setStats({
        total_enrolled: totalEnrolled,
        average_attendance: avgAttendance,
        this_week_present: thisWeekPresent,
        at_risk_count: atRiskCount
      })

    } catch (error: any) {
      console.error("Error fetching course data:", error)
      toast.error(error.message || "Failed to load course data")
    } finally {
      setIsLoading(false)
    }
  }, [params.id, supabase])

  useEffect(() => {
    fetchCourseData()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`course_${params.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=in.(${supabase
            .from('lecture_sessions')
            .select('id')
            .eq('course_id', params.id)
            .then(r => r.data?.map(s => s.id).join(',') || '')})`
        },
        () => {
          // Refresh data when attendance changes
          fetchCourseData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [params.id, supabase, fetchCourseData])

  const filteredStudents = students.filter(s =>
    s.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.matric_number.includes(searchTerm)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'good':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'Excellent'
      case 'good':
        return 'Good'
      case 'warning':
        return 'Warning'
      case 'critical':
        return 'Critical'
      default:
        return 'Unknown'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Link href="/lecturer/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Course not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/lecturer/courses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{course.code} - Course Summary</h1>
            <p className="text-muted-foreground">{course.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Enrolled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_enrolled}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.average_attendance}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.this_week_present} Present</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.at_risk_count} Students</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Enrolled Students ({filteredStudents.length})</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or matric..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Matric Number</th>
                  <th className="p-4">Attendance</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      No students found
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.first_name} {student.last_name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-gray-600">{student.matric_number}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full max-w-[100px] h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                student.attendance_percentage >= 80
                                  ? 'bg-emerald-500'
                                  : student.attendance_percentage >= 70
                                  ? 'bg-blue-500'
                                  : student.attendance_percentage >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${student.attendance_percentage}%` }}
                            />
                          </div>
                          <span className="font-bold text-sm">
                            {student.attendance_count}/{student.total_sessions}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={`border ${getStatusColor(student.status)}`}>
                          {getStatusLabel(student.status)}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled>View Profile</DropdownMenuItem>
                            <DropdownMenuItem disabled>Attendance History</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
