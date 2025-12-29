"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import Link from "next/link"

const DEPARTMENTS = [
  "Computer Science",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Statistics",
]

const LEVELS = ["100", "200", "300", "400", "500", "PG"]

const SEMESTERS = ["First", "Second"]

export default function NewCoursePage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    department: "",
    level: "",
    semester: "",
    credits: "3",
    academic_year: "2024/2025",
    min_attendance_percentage: "75",
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!formData.code || !formData.title || !formData.department || !formData.level || !formData.semester) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('courses')
        .insert({
          code: formData.code.toUpperCase(),
          title: formData.title,
          description: formData.description || null,
          department: formData.department,
          level: formData.level,
          semester: formData.semester,
          credits: parseInt(formData.credits),
          academic_year: formData.academic_year,
          min_attendance_percentage: parseInt(formData.min_attendance_percentage),
          lecturer_id: user.id,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          // Course code exists - offer to assign it to this lecturer
          const { data: existingCourse } = await supabase
            .from('courses')
            .select('id, lecturer_id, title')
            .eq('code', formData.code.toUpperCase())
            .single()
          
          if (existingCourse && !existingCourse.lecturer_id) {
            // Course exists but has no lecturer - assign it
            const { error: updateError } = await supabase
              .from('courses')
              .update({ lecturer_id: user.id })
              .eq('id', existingCourse.id)
            
            if (!updateError) {
              toast.success(`Course "${existingCourse.title}" has been assigned to you!`)
              router.push('/lecturer/courses')
              return
            }
          }
          
          toast.error("A course with this code already exists and is assigned to another lecturer")
        } else {
          throw error
        }
        return
      }

      toast.success("Course created successfully!")
      router.push('/lecturer/courses')
    } catch (error: any) {
      console.error("Error creating course:", error)
      toast.error(error.message || "Failed to create course")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl py-10">
      <div className="mb-8">
        <Link 
          href="/lecturer/courses" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Courses
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
        <p className="text-muted-foreground mt-1">
          Add a new course to your teaching portfolio
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Details
          </CardTitle>
          <CardDescription>
            Fill in the information below to create a new course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Code & Title */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Course Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., CSC301"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Data Structures"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the course..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>

            {/* Department & Level */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleChange("department", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Level *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => handleChange("level", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level} Level
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Semester & Academic Year */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Semester *</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => handleChange("semester", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTERS.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        {sem} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="academic_year">Academic Year</Label>
                <Input
                  id="academic_year"
                  placeholder="e.g., 2024/2025"
                  value={formData.academic_year}
                  onChange={(e) => handleChange("academic_year", e.target.value)}
                />
              </div>
            </div>

            {/* Credits & Min Attendance */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="credits">Credit Units</Label>
                <Select
                  value={formData.credits}
                  onValueChange={(value) => handleChange("credits", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((c) => (
                      <SelectItem key={c} value={c.toString()}>
                        {c} Unit{c > 1 ? "s" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_attendance">Min. Attendance %</Label>
                <Select
                  value={formData.min_attendance_percentage}
                  onValueChange={(value) => handleChange("min_attendance_percentage", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[50, 60, 70, 75, 80, 85, 90].map((p) => (
                      <SelectItem key={p} value={p.toString()}>
                        {p}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
