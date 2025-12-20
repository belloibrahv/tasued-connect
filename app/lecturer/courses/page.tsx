"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Users,
  Clock,
  TrendingUp,
  ExternalLink,
  Loader2,
  GraduationCap,
  CalendarDays,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Activity
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
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import toast from "react-hot-toast"

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
          avgAttendance: avgAtt
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Decoding Curriculum Architecture...</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-sm">
              <BookOpen className="w-6 h-6" />
            </div>
            <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-extrabold uppercase text-[10px] tracking-widest px-4 py-1.5 bg-primary/5">Academic Repository</Badge>
          </div>
          <h1 className="text-4xl font-heading font-extrabold text-gray-900 tracking-tight leading-none italic">Module Management</h1>
          <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-xl">Overseeing <span className="text-primary font-black">{courses.length} high-fidelity modules</span> with real-time enrollment and session monitoring.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group flex-grow">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Filter by code or title..."
              className="h-16 pl-14 pr-6 rounded-[1.25rem] bg-white border-none shadow-xl shadow-gray-100/50 focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-16 rounded-[1.25rem] border-none bg-white shadow-xl shadow-gray-100/50 px-8 font-extrabold text-xs uppercase tracking-widest text-gray-500 hover:text-primary transition-all">
            <Filter className="w-4 h-4 mr-3" />
            Refine Catalog
          </Button>
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <AnimatePresence>
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course, i) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
              >
                <Card className="group relative border-none shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden flex flex-col border border-gray-100/50">
                  {/* Top Progress Bar for Attendance Status */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${course.avgAttendance}%` }}
                      className={cn("h-full", course.avgAttendance >= 75 ? "bg-emerald-500" : course.avgAttendance >= 60 ? "bg-amber-500" : "bg-rose-500")}
                    />
                  </div>

                  <CardHeader className="p-10 pb-4">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex flex-col gap-1">
                        <Badge className="w-fit bg-primary/10 text-primary border-none font-extrabold uppercase tracking-widest text-[9px] py-1 px-3">
                          {course.code}
                        </Badge>
                        <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-[0.2em] leading-none mt-2">
                          {course.department}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-gray-50">
                            <MoreVertical className="w-5 h-5 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-[1.5rem] w-64 p-2 shadow-2xl border-none">
                          <div className="p-3 mb-2 bg-gray-50 rounded-xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Management Console</p>
                          </div>
                          <DropdownMenuItem className="gap-3 py-3.5 rounded-xl cursor-pointer font-bold">
                            <TrendingUp className="w-4 h-4 text-primary" /> Performance Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-3 py-3.5 rounded-xl cursor-pointer font-bold">
                            <Users className="w-4 h-4 text-primary" /> Enrollment Roster
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-2" />
                          <DropdownMenuItem className="gap-3 py-3.5 rounded-xl cursor-pointer text-rose-600 font-bold hover:bg-rose-50">
                            <AlertCircle className="w-4 h-4" /> Integrity Report
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardTitle className="text-2xl font-black text-gray-900 group-hover:text-primary transition-all line-clamp-2 min-h-[4rem] tracking-tight italic">
                      {course.title}
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-10 pt-0 flex-grow">
                    <div className="grid grid-cols-2 gap-6 mb-10">
                      <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100/50 group-hover:bg-primary/5 transition-colors">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-2">Reach</p>
                        <p className="text-2xl font-black text-gray-900">{course.studentCount} <span className="text-[9px] text-gray-400 ml-1">PAX</span></p>
                      </div>
                      <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100/50 group-hover:bg-primary/5 transition-colors">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-2">Yield</p>
                        <p className={cn("text-2xl font-black", course.avgAttendance >= 75 ? "text-emerald-600" : "text-amber-600")}>
                          {course.avgAttendance}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-5 bg-primary/5 rounded-3xl border border-primary/10 group-hover:bg-primary/10 transition-colors">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm border border-primary/5">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.15em] leading-none mb-1.5">Operational Efficiency</p>
                        <p className="text-xs font-black text-gray-900">{course.sessionCount} Sessions Record</p>
                      </div>
                    </div>
                  </CardContent>

                  <div className="p-10 pt-0 mt-auto">
                    <div className="flex gap-3">
                      <Link href={`/lecturer/courses/${course.id}`} className="flex-grow">
                        <Button className="w-full h-14 rounded-2xl font-black bg-primary hover:bg-primary/95 shadow-xl shadow-primary/20 group/btn uppercase text-xs tracking-widest">
                          Launch Control
                          <ArrowRight className="w-4 h-4 ml-3 group-hover/btn:translate-x-1.5 transition-transform" />
                        </Button>
                      </Link>
                      {course.activeSessionId && (
                        <Link href={`/lecturer/sessions/${course.activeSessionId}`}>
                          <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 relative group/live shadow-sm">
                            <div className="absolute top-1 right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                            <Play className="w-6 h-6 fill-current" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-40 text-center border-4 border-dashed rounded-[3rem] bg-gray-50/50 border-gray-100 flex flex-col items-center justify-center space-y-8"
            >
              <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center group overflow-hidden">
                <GraduationCap className="w-16 h-16 text-gray-200 group-hover:text-primary transition-all duration-1000 group-hover:rotate-12" />
              </div>
              <div className="space-y-3">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight italic">Zero Resource Mapping</h3>
                <p className="text-gray-400 font-extrabold uppercase tracking-widest text-[10px] max-w-sm mx-auto leading-relaxed">Your profile is currently not associated with any active academic module for the current cycle.</p>
              </div>
              <Button className="h-16 px-10 rounded-2xl font-black bg-gray-900 text-white shadow-2xl group active:scale-95 transition-all text-xs uppercase tracking-widest">
                Request System Sync
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function Play({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
  )
}
