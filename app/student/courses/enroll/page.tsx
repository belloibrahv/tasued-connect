"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, BookOpen, Users, ArrowLeft, CheckCircle, Plus } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function EnrollCoursePage() {
  const [courses, setCourses] = useState<any[]>([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get user's level and department for filtering
      const { data: userData } = await supabase
        .from('users')
        .select('level, department')
        .eq('id', user.id)
        .single()

      // Get all active courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          users:lecturer_id (first_name, last_name, title),
          course_enrollments (id)
        `)
        .eq('is_active', true)
        .order('code')

      if (coursesError) throw coursesError

      // Get user's enrolled courses
      const { data: enrollmentsData } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', user.id)
        .eq('status', 'active')

      const enrolledIds = (enrollmentsData || []).map(e => e.course_id)
      setEnrolledCourseIds(enrolledIds)

      // Format courses with enrollment count
      const formattedCourses = (coursesData || []).map(course => ({
        ...course,
        lecturerName: course.users 
          ? `${course.users.title || ''} ${course.users.first_name} ${course.users.last_name}`.trim()
          : 'TBA',
        studentCount: course.course_enrollments?.length || 0,
        isEnrolled: enrolledIds.includes(course.id)
      }))

      setCourses(formattedCourses)
    } catch (error: any) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to load courses")
    } finally {
      setIsLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          course_id: courseId,
          student_id: user.id,
          status: 'active'
        })

      if (error) {
        if (error.code === '23505') {
          toast.error("You are already enrolled in this course")
        } else {
          throw error
        }
        return
      }

      toast.success("Successfully enrolled in course!")
      setEnrolledCourseIds(prev => [...prev, courseId])
      setCourses(prev => prev.map(c => 
        c.id === courseId ? { ...c, isEnrolled: true, studentCount: c.studentCount + 1 } : c
      ))
    } catch (error: any) {
      console.error("Error enrolling:", error)
      toast.error(error.message || "Failed to enroll")
    } finally {
      setEnrollingId(null)
    }
  }

  const filteredCourses = courses.filter(c => {
    const searchStr = `${c.code} ${c.title} ${c.department} ${c.lecturerName}`.toLowerCase()
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
      <div className="flex flex-col gap-4">
        <Link 
          href="/student/courses" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Courses
        </Link>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Browse Courses</h1>
            <p className="text-muted-foreground">
              Find and enroll in available courses
            </p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary">{course.code}</Badge>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{course.studentCount}</span>
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                <CardDescription>
                  {course.lecturerName} • {course.department}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{course.level} Level</Badge>
                  <Badge variant="outline">{course.semester} Semester</Badge>
                  <Badge variant="outline">{course.credits} Units</Badge>
                </div>

                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                )}

                <div className="pt-2">
                  {course.isEnrolled ? (
                    <Button variant="outline" className="w-full" disabled>
                      <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                      Enrolled
                    </Button>
                  ) : (
                    <Button 
                      className="w-full"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrollingId === course.id}
                    >
                      {enrollingId === course.id ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Enroll
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No courses found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Try a different search term." : "No courses are available at the moment."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
