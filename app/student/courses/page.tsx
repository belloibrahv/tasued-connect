"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { CourseCard } from "@/components/student/CourseCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Plus } from "lucide-react"
import Link from "next/link"

export default function CoursesPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()

  const fetchCourses = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          *,
          courses (
            *, 
            lecturers:lecturer_id(first_name, last_name, title),
            lecture_sessions(id, topic, venue, session_date, status)
          )
        `)
        .eq('student_id', user.id)
        .eq('status', 'active')

      if (error) throw error

      setEnrollments(data || [])
    } catch (error: any) {
      console.error("Error fetching student courses:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const filteredCourses = enrollments.filter(e => {
    const searchStr = `${e.courses?.code} ${e.courses?.title} ${e.courses?.department}`.toLowerCase()
    return searchStr.includes(searchTerm.toLowerCase())
  })

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
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">
            Manage and track your attendance for all registered courses.
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
          <Link href="/student/courses/enroll">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Enroll
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((e) => {
            const activeSession = e.courses.lecture_sessions?.find((s: any) => s.status === 'active')
            const scheduledSession = e.courses.lecture_sessions?.filter((s: any) => s.status === 'scheduled')
              .sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0]

            const nextSessionText = activeSession
              ? `Active: ${activeSession.topic}`
              : scheduledSession
                ? `Upcoming: ${format(new Date(scheduledSession.session_date))} @ ${scheduledSession.venue}`
                : "No sessions"

            return (
              <CourseCard
                key={e.id}
                id={e.courses.id}
                code={e.courses.code}
                title={e.courses.title}
                lecturer={e.courses.lecturers ? `${e.courses.lecturers.title} ${e.courses.lecturers.last_name}` : "TBA"}
                attendance={Math.round(e.attendance_percentage || 0)}
                nextClass={nextSessionText}
              />
            )
          })
        ) : (
          <div className="col-span-full flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <h3 className="text-lg font-semibold">No courses found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Try searching for something else." : "You are not enrolled in any courses yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function format(date: Date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[date.getMonth()]} ${date.getDate()}`
}
