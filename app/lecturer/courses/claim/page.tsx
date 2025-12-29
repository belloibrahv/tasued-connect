"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, BookOpen, Users, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import Link from "next/link"

export default function ClaimCoursePage() {
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const supabase = createClient()

  const fetchCourses = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get all courses that don't have a lecturer assigned OR are assigned to current user
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          users:lecturer_id (first_name, last_name, title, email)
        `)
        .eq('is_active', true)
        .order('code')

      if (error) throw error

      const formattedCourses = (data || []).map(course => ({
        ...course,
        lecturerName: course.users 
          ? `${course.users.title || ''} ${course.users.first_name} ${course.users.last_name}`.trim()
          : null,
        isOwned: course.lecturer_id === user.id,
        isAvailable: !course.lecturer_id
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
    fetchCourses()
  }, [fetchCourses])

  const handleClaim = async (courseId: string) => {
    setClaimingId(courseId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      const { error } = await supabase
        .from('courses')
        .update({ lecturer_id: user.id })
        .eq('id', courseId)

      if (error) throw error

      toast.success("Course assigned to you successfully!")
      
      // Update local state
      setCourses(prev => prev.map(c => 
        c.id === courseId 
          ? { ...c, lecturer_id: user.id, isOwned: true, isAvailable: false, lecturerName: 'You' } 
          : c
      ))
    } catch (error: any) {
      console.error("Error claiming course:", error)
      toast.error(error.message || "Failed to claim course")
    } finally {
      setClaimingId(null)
    }
  }

  const filteredCourses = courses.filter(c => {
    const searchStr = `${c.code} ${c.title} ${c.department}`.toLowerCase()
    return searchStr.includes(searchTerm.toLowerCase())
  })

  // Separate into available and assigned courses
  const availableCourses = filteredCourses.filter(c => c.isAvailable)
  const myCourses = filteredCourses.filter(c => c.isOwned)
  const otherCourses = filteredCourses.filter(c => !c.isAvailable && !c.isOwned)

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
          href="/lecturer/courses" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground w-fit"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Courses
        </Link>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Claim Courses</h1>
            <p className="text-muted-foreground">
              Assign existing courses to yourself
            </p>
          </div>
          <Input
            placeholder="Search courses..."
            className="w-full md:w-72"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* My Courses */}
      {myCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-emerald-700">Your Courses ({myCourses.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myCourses.map((course) => (
              <Card key={course.id} className="border-emerald-200 bg-emerald-50/50">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary">{course.code}</Badge>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.department} • {course.level} Level</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/lecturer/courses/${course.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Course
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Courses */}
      {availableCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Available Courses ({availableCourses.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary">{course.code}</Badge>
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Unassigned
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{course.department} • {course.level} Level</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleClaim(course.id)}
                    disabled={claimingId === course.id}
                    className="w-full"
                  >
                    {claimingId === course.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Claim This Course
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Other Lecturers' Courses */}
      {otherCourses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Assigned to Other Lecturers ({otherCourses.length})
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {otherCourses.map((course) => (
              <Card key={course.id} className="opacity-60">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="secondary">{course.code}</Badge>
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>
                    {course.department} • {course.level} Level
                    <br />
                    <span className="text-xs">Lecturer: {course.lecturerName}</span>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filteredCourses.length === 0 && (
        <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No courses found</h3>
          <p className="text-sm text-muted-foreground">
            {searchTerm ? "Try a different search term." : "No courses are available in the system."}
          </p>
        </div>
      )}
    </div>
  )
}
