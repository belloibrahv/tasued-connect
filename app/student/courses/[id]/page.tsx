"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowLeft, 
  Calendar, 
  CheckCircle, 
  Clock, 
  MapPin, 
  User, 
  XCircle, 
  Loader2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BookOpen
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"

interface AttendanceRecord {
  id: string
  is_present: boolean
  marked_at: string
  marking_method: string
  session_id: string
  lecture_sessions: {
    id: string
    location: string
    session_date: string
    start_time: string
  }
}

interface CourseData {
  id: string
  code: string
  title: string
  department: string
  credits: number
  lecturer: {
    first_name: string
    last_name: string
    title: string | null
  } | null
}

interface EnrollmentData {
  classes_attended: number
  total_classes: number
  attendance_percentage: number
}

export default function CourseDetailsPage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<CourseData | null>(null)
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [allSessions, setAllSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          id, code, title, department, credits,
          lecturer:lecturer_id (first_name, last_name, title)
        `)
        .eq('id', params.id)
        .single()

      if (courseError) throw courseError
      setCourse(courseData as any)

      // Fetch enrollment data
      const { data: enrollmentData } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('course_id', params.id)
        .eq('student_id', user.id)
        .single()

      // Fetch all sessions for this course
      const { data: sessionsData } = await supabase
        .from('lecture_sessions')
        .select('id, location, session_date, start_time, status')
        .eq('course_id', params.id)
        .in('status', ['active', 'completed'])
        .order('session_date', { ascending: false })

      setAllSessions(sessionsData || [])

      // Fetch student's attendance records
      const { data: recordsData } = await supabase
        .from('attendance_records')
        .select(`
          id, is_present, marked_at, marking_method,
          session_id,
          lecture_sessions (id, location, session_date, start_time)
        `)
        .eq('student_id', user.id)
        .in('session_id', (sessionsData || []).map(s => s.id))
        .order('marked_at', { ascending: false })

      setAttendanceRecords((recordsData as any) || [])

      // Calculate attendance stats
      const totalSessions = sessionsData?.length || 0
      const attendedSessions = recordsData?.filter((r: any) => r.is_present).length || 0
      const attendancePercentage = totalSessions > 0 
        ? Math.round((attendedSessions / totalSessions) * 100)
        : 0

      setEnrollment({
        classes_attended: attendedSessions,
        total_classes: totalSessions,
        attendance_percentage: attendancePercentage
      })

    } catch (error) {
      console.error("Error fetching course data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [params.id, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Course not found</p>
      </div>
    )
  }

  const attendancePercentage = enrollment?.attendance_percentage || 0
  const classesAttended = enrollment?.classes_attended || 0
  const totalClasses = enrollment?.total_classes || allSessions.length
  const classesAbsent = totalClasses - classesAttended
  const lecturerName = course?.lecturer 
    ? Array.isArray(course.lecturer)
      ? `${course.lecturer[0]?.title || ''} ${course.lecturer[0]?.first_name || ''} ${course.lecturer[0]?.last_name || ''}`.trim()
      : `${course.lecturer?.title || ''} ${course.lecturer?.first_name || ''} ${course.lecturer?.last_name || ''}`.trim()
    : 'TBA'

  // Determine attendance status
  const getAttendanceStatus = () => {
    if (attendancePercentage >= 90) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-50' }
    if (attendancePercentage >= 75) return { label: 'Good Standing', color: 'text-blue-600', bg: 'bg-blue-50' }
    if (attendancePercentage >= 60) return { label: 'At Risk', color: 'text-amber-600', bg: 'bg-amber-50' }
    return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50' }
  }

  const status = getAttendanceStatus()

  // Build complete attendance history (including absences)
  const buildAttendanceHistory = () => {
    const history = allSessions.map(session => {
      const record = attendanceRecords.find((r: any) => r.session_id === session.id)
      
      if (record) {
        const sessionData = Array.isArray(record.lecture_sessions) 
          ? record.lecture_sessions[0] 
          : record.lecture_sessions
        return {
          sessionId: session.id,
          date: sessionData?.session_date || session.session_date,
          location: sessionData?.location || session.location,
          status: record.is_present ? 'present' : 'absent',
          time: format(new Date(record.marked_at), 'h:mm a'),
          method: record.marking_method
        }
      } else {
        return {
          sessionId: session.id,
          date: session.session_date,
          location: session.location,
          status: 'absent',
          time: null,
          method: null
        }
      }
    })

    return history
  }

  const history = buildAttendanceHistory()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/student/courses" className="p-1 -ml-1">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900">{course.code}</h1>
            <p className="text-xs text-gray-500">{course.title}</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Attendance Overview Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Your Attendance</h2>
              <Badge className={`${status.bg} ${status.color} border-0`}>
                {status.label}
              </Badge>
            </div>

            <div className="flex items-end gap-2 mb-3">
              <span className="text-5xl font-bold text-gray-900">
                {Math.round(attendancePercentage)}
              </span>
              <span className="text-2xl text-gray-400 mb-1">%</span>
              {attendancePercentage >= 75 ? (
                <TrendingUp className="w-6 h-6 text-emerald-500 mb-2 ml-2" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-500 mb-2 ml-2" />
              )}
            </div>

            <Progress 
              value={attendancePercentage} 
              className="h-3 mb-4"
            />

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{classesAttended}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{classesAbsent}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalClasses}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>

            {attendancePercentage < 75 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Attendance Warning</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Your attendance is below 75%. You need to attend more classes to avoid being barred from exams.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Course Info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Course Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Lecturer</p>
                  <p className="text-sm font-medium text-gray-900">{lecturerName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium text-gray-900">{course.department}</p>
                </div>
              </div>
              {course.credits && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Credit Units</p>
                    <p className="text-sm font-medium text-gray-900">{course.credits} Units</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Attendance History</h2>
              <p className="text-xs text-gray-500 mt-0.5">Your attendance record for all sessions</p>
            </div>

            {history.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {history.map((record, i) => (
                  <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        record.status === 'present' ? 'bg-emerald-50' : 'bg-red-50'
                      }`}>
                        {record.status === 'present' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          Class Session
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>{format(new Date(record.date), 'MMM d, yyyy')}</span>
                          {record.location && (
                            <>
                              <span>•</span>
                              <span>{record.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${
                          record.status === 'present' ? 'bg-emerald-50 text-emerald-700' : 
                          'bg-red-50 text-red-700'
                        }`}
                      >
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                      {record.time && (
                        <p className="text-xs text-gray-400 mt-1">{record.time}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 text-sm">No sessions recorded yet</p>
                <p className="text-gray-400 text-xs mt-1">Attendance history will appear here</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
