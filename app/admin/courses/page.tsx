"use client"

import { useState, useEffect, useCallback } from "react"
import {
  BookOpen,
  Search,
  Plus,
  GraduationCap,
  Users,
  MoreVertical,
  Edit,
  ExternalLink,
  Filter,
  Layers,
  Calendar,
  Loader2,
  Trash2,
  CheckCircle2,
  UserCircle,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import toast from "react-hot-toast"
import { motion } from "framer-motion"

interface Course {
  id: string
  code: string
  title: string
  department: string
  level: string
  credits: number
  lecturer_id: string
  is_active: boolean
  lecturers?: {
    first_name: string
    last_name: string
    title: string
  }
  enrollmentCount: number
  sessionCount: number
  avgAttendance: number
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [deptFilter, setDeptFilter] = useState<string>("all")
  const [isNewCourseOpen, setIsNewCourseOpen] = useState(false)
  const [lecturers, setLecturers] = useState<any[]>([])

  // New Course Form State
  const [newCode, setNewCode] = useState("")
  const [newTitle, setNewTitle] = useState("")
  const [newDept, setNewDept] = useState("")
  const [newLevel, setNewLevel] = useState("100")
  const [newLecturer, setNewLecturer] = useState("")

  const supabase = createClient()

  const fetchCourses = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          lecturers:lecturer_id(first_name, last_name, title),
          course_enrollments(count, attendance_percentage),
          lecture_sessions(count)
        `)
        .order('code', { ascending: true })

      if (error) throw error

      const formatted: Course[] = data.map((c: any) => {
        const enrollments = c.course_enrollments || []
        const totalAttendance = enrollments.reduce((acc: number, curr: any) => acc + Number(curr.attendance_percentage), 0)
        const avg = enrollments.length ? Math.round(totalAttendance / enrollments.length) : 0

        return {
          ...c,
          enrollmentCount: c.course_enrollments?.[0]?.count || 0,
          sessionCount: c.lecture_sessions?.[0]?.count || 0,
          avgAttendance: avg
        }
      })

      setCourses(formatted)
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch courses")
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  const fetchLecturers = useCallback(async () => {
    try {
      const { data } = await supabase.from('users').select('id, first_name, last_name, title').eq('role', 'lecturer')
      setLecturers(data || [])
    } catch (error) {
      console.error("Error fetching lecturers:", error)
    }
  }, [supabase])

  useEffect(() => {
    fetchCourses()
    fetchLecturers()
  }, [fetchCourses, fetchLecturers])

  const departments = Array.from(new Set(courses.map(c => c.department))).sort()

  const filteredCourses = courses.filter(course => {
    const matchesSearch = `${course.code} ${course.title} ${course.department}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDept = deptFilter === "all" || course.department === deptFilter
    return matchesSearch && matchesDept
  })

  async function handleDeleteCourse(courseId: string) {
    if (!confirm("Are you sure? This will delete all enrollments and session history for this course.")) return

    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId)
      if (error) throw error
      setCourses(courses.filter(c => c.id !== courseId))
      toast.success("Course deleted successfully")
    } catch (error: any) {
      toast.error(error.message || "Delete failed")
    }
  }

  async function handleCreateCourse() {
    if (!newCode || !newTitle || !newDept) {
      toast.error("Please fill required fields")
      return
    }

    try {
      const { data, error } = await supabase.from('courses').insert({
        code: newCode.toUpperCase(),
        name: newTitle,
        department: newDept,
        level: newLevel,
        lecturer_id: newLecturer || null,
        year: new Date().getFullYear(),
        semester: 'First'
      }).select().single()

      if (error) throw error

      toast.success("Course created successfully")
      setIsNewCourseOpen(false)
      fetchCourses()
      // Reset form
      setNewCode("")
      setNewTitle("")
      setNewDept("")
      setNewLevel("100")
      setNewLecturer("")
    } catch (error: any) {
      toast.error(error.message || "Creation failed")
    }
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-bold mb-4 bg-primary/5">
            Curriculum Management
          </Badge>
          <h1 className="text-4xl font-heading font-extrabold text-gray-900 tracking-tight">Academic Catalog</h1>
          <p className="text-gray-500 font-medium">Monitoring and controlling {courses.length} active courses across all departments.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-12 rounded-xl border-gray-200 bg-white shadow-sm font-bold">
            <Layers className="w-4 h-4 mr-2" />
            Departments
          </Button>

          <Dialog open={isNewCourseOpen} onOpenChange={setIsNewCourseOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/95 font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Initialize Course
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem] max-w-lg border-none shadow-2xl">
              <DialogHeader className="p-4">
                <DialogTitle className="text-2xl font-bold">New Academic Course</DialogTitle>
                <DialogDescription>
                  Register a new course into the TASUED AttendX ecosystem.
                </DialogDescription>
              </DialogHeader>
              <div className="p-4 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Course Code</Label>
                    <Input placeholder="CSC 415" className="h-12 rounded-xl bg-gray-50 uppercase" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Level</Label>
                    <Select value={newLevel} onValueChange={setNewLevel}>
                      <SelectTrigger className="h-12 rounded-xl bg-gray-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="100">100 Level</SelectItem>
                        <SelectItem value="200">200 Level</SelectItem>
                        <SelectItem value="300">300 Level</SelectItem>
                        <SelectItem value="400">400 Level</SelectItem>
                        <SelectItem value="500">500 Level</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Course Title</Label>
                  <Input placeholder="Net-Centric Computing" className="h-12 rounded-xl bg-gray-50" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Department</Label>
                  <Input placeholder="Computer Science" className="h-12 rounded-xl bg-gray-50" value={newDept} onChange={(e) => setNewDept(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Assign Lecturer</Label>
                  <Select value={newLecturer} onValueChange={setNewLecturer}>
                    <SelectTrigger className="h-12 rounded-xl bg-gray-50">
                      <SelectValue placeholder="Select a lecturer" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {lecturers.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.title} {l.first_name} {l.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-4 flex gap-3">
                  <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setIsNewCourseOpen(false)}>Cancel</Button>
                  <Button className="flex-1 h-12 rounded-xl bg-primary font-bold shadow-lg shadow-primary/20" onClick={handleCreateCourse}>
                    Create Course
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white p-8 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Search className="w-4 h-4 text-primary" />
              Navigator
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Search</Label>
                <Input
                  placeholder="Filter catalog..."
                  className="h-11 rounded-xl bg-gray-50 border-none shadow-inner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Departments</Label>
                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  <button
                    onClick={() => setDeptFilter("all")}
                    className={cn(
                      "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                      deptFilter === "all" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:bg-gray-50"
                    )}
                  >
                    All Domains
                  </button>
                  {departments.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => setDeptFilter(dept)}
                      className={cn(
                        "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all",
                        deptFilter === dept ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] bg-gray-900 text-white p-8 overflow-hidden relative group">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <Calendar className="w-10 h-10 mb-6 text-primary" />
            <h3 className="text-xl font-extrabold mb-2 tracking-tight">Academic Cycle</h3>
            <p className="text-white/50 text-xs mb-8 leading-relaxed font-medium">Control the global active semester and examination scheduling windows.</p>
            <Button className="w-full bg-white/10 hover:bg-primary border-white/10 border-dashed border h-12 font-bold rounded-xl transition-all">
              Cycle Configuration
            </Button>
          </Card>
        </div>

        {/* Courses Listing */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="bg-white rounded-[2.5rem] p-32 flex flex-col items-center justify-center space-y-6 shadow-sm border border-gray-100">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-xs text-gray-400 font-extrabold uppercase tracking-[0.2em]">Archiving Catalog...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-32 text-center flex flex-col items-center justify-center space-y-6 shadow-sm border border-gray-100">
              <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center shadow-inner">
                <BookOpen className="w-12 h-12 text-gray-200" />
              </div>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No records matching deployment criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredCourses.map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-none shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group rounded-[2.5rem] overflow-hidden bg-white relative border border-gray-100/50">
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col gap-1">
                          <Badge className="w-fit bg-primary/10 text-primary border-none font-extrabold uppercase tracking-widest text-[10px] py-1">
                            Level {course.level}
                          </Badge>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">TASUED AttendX Engine</span>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-50">
                              <MoreVertical className="w-5 h-5 text-gray-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-2xl w-56 p-2 shadow-2xl border-none">
                            <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-3 py-2">Management</DropdownMenuLabel>
                            <DropdownMenuItem className="gap-3 py-3 rounded-xl font-bold cursor-pointer">
                              <Edit className="w-4 h-4 text-primary" /> Edit Blueprint
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 py-3 rounded-xl font-bold cursor-pointer">
                              <Users className="w-4 h-4 text-primary" /> Enrollment Audit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem className="gap-3 py-3 rounded-xl font-bold cursor-pointer text-rose-600 hover:bg-rose-50" onClick={() => handleDeleteCourse(course.id)}>
                              <Trash2 className="w-4 h-4" /> Decommission
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <h3 className="text-2xl font-extrabold text-gray-900 group-hover:text-primary transition-all leading-tight mb-2 tracking-tight">
                        {course.code}: {course.title}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-8">{course.department}</p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50 group-hover:bg-primary/5 transition-colors">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Enrolled</p>
                          <p className="text-xl font-extrabold text-gray-900">{course.enrollmentCount} <span className="text-[10px] text-gray-400">Students</span></p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50 group-hover:bg-primary/5 transition-colors text-right">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Attendance</p>
                          <p className={cn("text-xl font-extrabold", course.avgAttendance >= 75 ? "text-emerald-600" : "text-amber-600")}>
                            {course.avgAttendance}%
                          </p>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-bold border border-primary/10">
                            {course.lecturers ? course.lecturers.last_name[0] : '?'}
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Assigned Proctor</p>
                            <p className="text-xs font-extrabold text-gray-900">
                              {course.lecturers ? `${course.lecturers.title} ${course.lecturers.last_name}` : 'Awaiting Assignment'}
                            </p>
                          </div>
                        </div>
                        <Link href={`/admin/courses/${course.id}`}>
                          <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-300 group-hover:text-primary group-hover:bg-primary/5 rounded-xl transition-all">
                            <ChevronRight className="w-6 h-6" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
  )
}
