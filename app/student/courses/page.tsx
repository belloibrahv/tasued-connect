"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { CourseCard } from "@/components/student/CourseCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, BookOpen, Filter, GraduationCap, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"

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
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-xs text-gray-400 font-extrabold uppercase tracking-[0.2em]">Retrieving Course Blueprint...</p>
      </div>
    )
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-extrabold text-[10px] uppercase tracking-widest px-4 py-1.5 bg-primary/5">
              Session 2024/2025
            </Badge>
          </div>
          <h1 className="text-4xl font-heading font-extrabold text-gray-900 tracking-tight leading-none italic">Registered Modules</h1>
          <p className="text-gray-500 mt-3 font-medium text-lg">You are currently monitoring <span className="text-primary font-extrabold">{enrollments.length}</span> high-performance course tracks.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative group flex-grow">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by code, title or domain..."
              className="h-16 pl-14 pr-6 rounded-[1.25rem] bg-white border-none shadow-xl shadow-gray-100/50 focus:ring-2 focus:ring-primary/20 transition-all font-bold text-gray-900 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-16 rounded-[1.25rem] border-none bg-white shadow-xl shadow-gray-100/50 px-8 font-extrabold text-xs uppercase tracking-widest text-gray-500 hover:text-primary transition-all">
            <Filter className="w-4 h-4 mr-3" />
            Control Filter
          </Button>
        </div>
      </div>

      <AnimatePresence>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((e, i) => {
              // Find the next active or scheduled session
              const activeSession = e.courses.lecture_sessions?.find((s: any) => s.status === 'active')
              const scheduledSession = e.courses.lecture_sessions?.filter((s: any) => s.status === 'scheduled')
                .sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0]

              const nextSessionText = activeSession
                ? `Active: ${activeSession.topic} @ ${activeSession.venue}`
                : scheduledSession
                  ? `Upcoming: ${format(new Date(scheduledSession.session_date), 'MMM d')} @ ${scheduledSession.venue}`
                  : "No sessions scheduled"

              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <CourseCard
                    id={e.courses.id}
                    code={e.courses.code}
                    title={e.courses.title}
                    lecturer={e.courses.lecturers ? `${e.courses.lecturers.title} ${e.courses.lecturers.last_name}` : "Pending Assignment"}
                    attendance={Math.round(e.attendance_percentage || 0)}
                    nextClass={nextSessionText}
                    department={e.courses.department}
                  />
                </motion.div>
              )
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-40 text-center border-4 border-dashed rounded-[3rem] bg-gray-50/50 border-gray-100 flex flex-col items-center justify-center space-y-8"
            >
              <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center group">
                <Sparkles className="w-16 h-16 text-gray-200 group-hover:text-primary transition-all duration-700" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Cloud Catalog Empty</h3>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No course enrollments detected for the active semester.</p>
              </div>
              <Button className="h-14 px-8 rounded-2xl bg-primary font-extrabold shadow-2xl shadow-primary/30 group active:scale-95 transition-all">
                Initiate Enrollment System
              </Button>
            </motion.div>
          )}
        </div>
      </AnimatePresence>
    </div>
  )
}

function format(date: Date, formatStr: string) {
  // Basic date formatting helper if date-fns is not fully needed here
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}
