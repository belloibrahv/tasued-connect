"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BookOpen,
  Search,
  Plus,
  Users,
  Clock,
  ArrowRight,
  Loader2,
  BarChart3
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import toast from "react-hot-toast"
import { CourseSummaryReportButton } from "@/components/lecturer/CourseSummaryReportButton"

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  const fetchCourses = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user details for lecturer name
      const { data: userData } = await supabase
        .from('users')
        .select('first_name, last_name, title')
        .eq('id', user.id)
        .single()

      const lecturerName = userData 
        ? `${userData.title || ''} ${userData.first_name} ${userData.last_name}`.trim()
        : 'Unknown'

      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_enrollments (count, attendance_percentage),
          lecture_sessions (id, status, session_date)
        `)
        .eq('lecturer_id', user.id)

      if (error) throw error

      const formattedCourses = (data || []).map(c => {
        const sessions = c.lecture_sessions || []
        const activeSession = sessions.find((s: any) => s.status === 'active')
        const enrollments = c.course_enrollments || []
        const totalAtt = enrollments.reduce((acc: number, curr: any) => acc + Number(curr.attendance_percentage), 0)
        const avgAtt = enrollments.length ? Math.round(totalAtt / enrollments.length) : 0

        return {
          ...c,
          studentCount: c.course_enrollments?.[0]?.count || 0,
          sessionCount: sessions.length,
          activeSessionId: activeSession?.id,
          avgAttendance: avgAtt,
          lecturerName
        }
      })

      setCourses(formattedCourses)
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch courses")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const filteredCourses = courses.filter(c =>
    `${c.code} ${c.title} ${c.department}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Courses</h1>
          <p className="text-muted-foreground">
            View and manage your courses and lecture sessions.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Link href="/lecturer/courses/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Course
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary">{course.code}</Badge>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{course.studentCount}</span>
                  </div>
                </div>
                <CardTitle className="text-xl line-clamp-2">{course.title}</CardTitle>
                <CardDescription>{course.department}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{course.sessionCount} Sessions</span>
                  </div>
                  <Badge variant={course.avgAttendance >= 75 ? "default" : "destructive"}>
                    {course.avgAttendance}% Avg.
                  </Badge>
                </div>

                <div className="space-y-3 pt-4">
                  <div className="flex gap-2">
                    <Link href={`/lecturer/courses/${course.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Manage
                      </Button>
                    </Link>
                    {course.activeSessionId ? (
                      <Link href={`/lecturer/sessions/${course.activeSessionId}`} className="flex-1">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                          Active
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/lecturer/sessions/new?courseId=${course.id}`} className="flex-1">
                        <Button className="w-full">
                          Start Session
                        </Button>
                      </Link>
                    )}
                  </div>
                  <CourseSummaryReportButton
                    courseId={course.id}
                    courseCode={course.code}
                    courseTitle={course.title}
                    lecturerName={course.lecturerName}
                  />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No courses found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Try a different search term." : "You haven't been assigned to any courses yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
